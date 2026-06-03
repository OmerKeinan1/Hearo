// Pulse monitoring for HearO exposure sessions.
//
// Wraps the pulse source (mock generator today, HealthKit ACL when it lands)
// and adds:
//   - Per-session HR baseline measurement during AMBIENT_FADE_IN
//   - Spike detection: HR ≥ baseline × 1.15 sustained ≥ 8 s
//   - Normalization detection: HR ≤ baseline × 0.90
//   - Chronic high baseline handling (resting HR > 90 BPM)
//   - BLE disconnect: no readings for 8 s → watchConnected = false
//
// The hook emits events via onSpike / onNormalized callbacks so the session
// machine drives the audio engine directly. Callbacks are stable refs — safe
// to pass from session.tsx without triggering re-renders.

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePulse, PulsePhase } from '@/lib/pulse';

export type SessionState =
  | 'LOADING'
  | 'DISCLAIMER'
  | 'AMBIENT_FADE_IN'
  | 'ADAPTIVE_LOOP'
  | 'WIND_DOWN'
  | 'POST_SESSION';

/** Returned by usePulseMonitor. */
export interface PulseMonitorResult {
  pulseBpm: number;
  /** Baseline HR computed at the end of AMBIENT_FADE_IN. Null until ready. */
  sessionBaseline: number | null;
  /** Currently in a confirmed spike (≥15% above baseline, ≥8 s). */
  isSpiked: boolean;
  /** Whether the watch is considered connected. */
  watchConnected: boolean;
  /** For chronic high-baseline users: manual distress press counted as one
   *  source. Combined with HR threshold → full spike. */
  reportManualDistress: () => void;
}

interface Options {
  sessionState: SessionState;
  isSessionActive: boolean;
  onSpike: () => void;
  onNormalized: () => void;
  onWatchDisconnected: () => void;
  onWatchReconnected: () => void;
}

// Threshold constants (clinical parameters, Q1 answers).
const SPIKE_RATIO = 1.15;        // +15% above baseline
const NORMALIZE_RATIO = 0.90;    // HR ≤ 90% of baseline → normalized
const SPIKE_SUSTAIN_MS = 8_000;  // Must be elevated for 8 s continuously
const BLE_TIMEOUT_MS = 8_000;    // 8 s with no readings → disconnected
const CHRONIC_HIGH_BPM = 90;     // Resting HR above this = chronic high baseline

// How often we sample from the mock generator (real HealthKit fires own events).
const SAMPLE_INTERVAL_MS = 250;

// The mock PulsePhase during ADAPTIVE_LOOP — drives the mock generator curve.
// In a real HealthKit build this would be removed.
const ADAPTIVE_MOCK_PHASE: PulsePhase = 'rising';

export function usePulseMonitor({
  sessionState,
  isSessionActive,
  onSpike,
  onNormalized,
  onWatchDisconnected,
  onWatchReconnected,
}: Options): PulseMonitorResult {
  // Use the existing mock generator as the pulse source.
  // In AMBIENT_FADE_IN + ADAPTIVE_LOOP we drive it with the appropriate phase.
  const mockPhase: PulsePhase =
    sessionState === 'ADAPTIVE_LOOP' ? ADAPTIVE_MOCK_PHASE : 'baseline';

  const rawBpm = usePulse({
    active: isSessionActive && sessionState !== 'LOADING',
    phase: mockPhase,
  });

  // ── State ────────────────────────────────────────────────────────────────

  const [sessionBaseline, setSessionBaseline] = useState<number | null>(null);
  const [isSpiked, setIsSpiked] = useState(false);
  const [watchConnected, setWatchConnected] = useState(true);

  // ── Refs (mutable, not reactive) ─────────────────────────────────────────

  const baselineReadings = useRef<number[]>([]);
  const spikeStartedAt = useRef<number | null>(null);
  const isSpikedRef = useRef(false);
  const sessionBaselineRef = useRef<number | null>(null);
  const lastReadingAt = useRef<number>(Date.now());
  const watchConnectedRef = useRef(true);
  // For chronic high-baseline: pending manual distress signal.
  const pendingManualDistress = useRef(false);
  const bleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback refs — avoid re-wiring effects when parent re-renders.
  const onSpikeRef = useRef(onSpike);
  const onNormalizedRef = useRef(onNormalized);
  const onWatchDisconnectedRef = useRef(onWatchDisconnected);
  const onWatchReconnectedRef = useRef(onWatchReconnected);
  useEffect(() => { onSpikeRef.current = onSpike; }, [onSpike]);
  useEffect(() => { onNormalizedRef.current = onNormalized; }, [onNormalized]);
  useEffect(() => { onWatchDisconnectedRef.current = onWatchDisconnected; }, [onWatchDisconnected]);
  useEffect(() => { onWatchReconnectedRef.current = onWatchReconnected; }, [onWatchReconnected]);

  // ── Baseline collection (AMBIENT_FADE_IN) ───────────────────────────────

  useEffect(() => {
    if (sessionState !== 'AMBIENT_FADE_IN') return;

    const id = setInterval(() => {
      baselineReadings.current.push(rawBpm);
    }, SAMPLE_INTERVAL_MS);

    return () => clearInterval(id);
  }, [sessionState, rawBpm]);

  // When AMBIENT_FADE_IN ends, compute and lock the baseline.
  useEffect(() => {
    if (sessionState !== 'ADAPTIVE_LOOP') return;
    if (sessionBaselineRef.current !== null) return; // already set

    const readings = baselineReadings.current;
    if (readings.length === 0) return;

    const baseline =
      readings.reduce((sum, v) => sum + v, 0) / readings.length;
    sessionBaselineRef.current = baseline;
    setSessionBaseline(baseline);
  }, [sessionState]);

  // ── BLE connectivity tracking ────────────────────────────────────────────

  useEffect(() => {
    // Each new rawBpm value is a "reading received" signal.
    lastReadingAt.current = Date.now();

    if (!watchConnectedRef.current) {
      // Watch reconnected.
      watchConnectedRef.current = true;
      setWatchConnected(true);
      onWatchReconnectedRef.current();
    }

    // Reset the disconnect timer.
    if (bleTimeoutRef.current) clearTimeout(bleTimeoutRef.current);
    bleTimeoutRef.current = setTimeout(() => {
      watchConnectedRef.current = false;
      setWatchConnected(false);
      onWatchDisconnectedRef.current();
    }, BLE_TIMEOUT_MS);

    return () => {
      if (bleTimeoutRef.current) clearTimeout(bleTimeoutRef.current);
    };
  }, [rawBpm]);

  // ── Spike detection (ADAPTIVE_LOOP only) ─────────────────────────────────

  useEffect(() => {
    if (sessionState !== 'ADAPTIVE_LOOP') return;
    const baseline = sessionBaselineRef.current;
    if (baseline === null) return;

    const isChronicHighBaseline = baseline > CHRONIC_HIGH_BPM;
    const hrAboveThreshold = rawBpm >= baseline * SPIKE_RATIO;

    if (hrAboveThreshold) {
      if (spikeStartedAt.current === null) {
        spikeStartedAt.current = Date.now();
      }

      const sustainedMs = Date.now() - spikeStartedAt.current;

      if (!isSpikedRef.current && sustainedMs >= SPIKE_SUSTAIN_MS) {
        // For chronic high-baseline users: require dual confirmation.
        if (isChronicHighBaseline && !pendingManualDistress.current) {
          // HR threshold met — log it, wait for manual distress button.
          // (no PulseSpiked yet — single source)
          return;
        }

        // Full spike confirmed.
        isSpikedRef.current = true;
        pendingManualDistress.current = false;
        setIsSpiked(true);
        onSpikeRef.current();
      }
    } else {
      // HR dropped below spike threshold — reset sustain timer.
      spikeStartedAt.current = null;
      pendingManualDistress.current = false;

      // Check for normalization (HR ≤ 90% baseline after a spike).
      if (isSpikedRef.current && rawBpm <= baseline * NORMALIZE_RATIO) {
        isSpikedRef.current = false;
        setIsSpiked(false);
        onNormalizedRef.current();
      }
    }
  }, [rawBpm, sessionState]);

  // ── Manual distress (chronic high-baseline dual-source) ──────────────────

  const reportManualDistress = useCallback(() => {
    const baseline = sessionBaselineRef.current;
    if (baseline === null) return;

    const isChronicHighBaseline = baseline > CHRONIC_HIGH_BPM;

    if (isChronicHighBaseline) {
      // If HR is above threshold, this is the second source → full spike.
      if (rawBpm >= baseline * SPIKE_RATIO) {
        pendingManualDistress.current = true;
        // The next spike-detection tick will fire the event.
      }
    }
    // For non-chronic users the manual distress button drives the engine
    // directly (manual mode), not through usePulseMonitor — see session.tsx.
  }, [rawBpm]);

  return {
    pulseBpm: rawBpm,
    sessionBaseline,
    isSpiked,
    watchConnected,
    reportManualDistress,
  };
}
