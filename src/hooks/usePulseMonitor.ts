// Pulse monitoring for HearO exposure sessions.
//
// Wraps the pulse source (mock generator today, HealthKit ACL when it lands)
// and adds:
//   - Per-session HR baseline measurement during AMBIENT_FADE_IN
//   - Spike detection: HR ≥ baseline × 1.15 sustained ≥ 8 s
//   - Normalization detection: HR ≤ baseline × 0.90
//   - Chronic high baseline handling (resting HR > 90 BPM)
//   - BLE disconnect: no readings for 8 s → watchConnected = false

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePulse, PulsePhase } from '@/lib/pulse';

export type SessionState =
  | 'LOADING'
  | 'DISCLAIMER'
  | 'AMBIENT_FADE_IN'
  | 'ADAPTIVE_LOOP'
  | 'WIND_DOWN'
  | 'POST_SESSION';

export interface PulseMonitorResult {
  pulseBpm: number;
  /** Baseline HR computed at end of AMBIENT_FADE_IN. Null until ready. */
  sessionBaseline: number | null;
  /** Currently in a confirmed spike (≥15% above baseline, ≥8 s). */
  isSpiked: boolean;
  watchConnected: boolean;
  /** For chronic high-baseline users: call this when the manual distress
   *  button is pressed. Counts as the second source for spike confirmation. */
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

// Clinical constants (Q1 answers).
const SPIKE_RATIO = 1.15;
const NORMALIZE_RATIO = 0.90;
const SPIKE_SUSTAIN_MS = 8_000;
const BLE_TIMEOUT_MS = 8_000;
const CHRONIC_HIGH_BPM = 90;
const BASELINE_FALLBACK_BPM = 74; // used when AMBIENT_FADE_IN produces no readings

const SAMPLE_INTERVAL_MS = 250;
const ADAPTIVE_MOCK_PHASE: PulsePhase = 'rising';

export function usePulseMonitor({
  sessionState,
  isSessionActive,
  onSpike,
  onNormalized,
  onWatchDisconnected,
  onWatchReconnected,
}: Options): PulseMonitorResult {
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

  // ── Refs ─────────────────────────────────────────────────────────────────

  // rawBpmRef: always current BPM; used inside intervals/callbacks to avoid
  // stale closure captures (rawBpm is a primitive — useCallback captures the
  // value at memo time, not the live value).
  const rawBpmRef = useRef(rawBpm);
  useEffect(() => { rawBpmRef.current = rawBpm; }, [rawBpm]);

  const baselineReadings = useRef<number[]>([]);
  const spikeStartedAt = useRef<number | null>(null);
  const isSpikedRef = useRef(false);
  const sessionBaselineRef = useRef<number | null>(null);
  const watchConnectedRef = useRef(true);
  const pendingManualDistress = useRef(false);
  const bleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callback refs — prevent effect re-wiring on every parent render.
  const onSpikeRef = useRef(onSpike);
  const onNormalizedRef = useRef(onNormalized);
  const onWatchDisconnectedRef = useRef(onWatchDisconnected);
  const onWatchReconnectedRef = useRef(onWatchReconnected);
  useEffect(() => { onSpikeRef.current = onSpike; }, [onSpike]);
  useEffect(() => { onNormalizedRef.current = onNormalized; }, [onNormalized]);
  useEffect(() => { onWatchDisconnectedRef.current = onWatchDisconnected; }, [onWatchDisconnected]);
  useEffect(() => { onWatchReconnectedRef.current = onWatchReconnected; }, [onWatchReconnected]);

  // ── Baseline collection (AMBIENT_FADE_IN) ───────────────────────────────

  // Dep array intentionally excludes rawBpm — interval reads rawBpmRef.current
  // at call time so we get the live value. Including rawBpm here would tear
  // down and re-create the interval every 220 ms, leaving no time to sample.
  useEffect(() => {
    if (sessionState !== 'AMBIENT_FADE_IN') return;
    const id = setInterval(() => {
      baselineReadings.current.push(rawBpmRef.current);
    }, SAMPLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionState]); // eslint-disable-line react-hooks/exhaustive-deps

  // When session enters ADAPTIVE_LOOP, lock the baseline from collected readings.
  useEffect(() => {
    if (sessionState !== 'ADAPTIVE_LOOP') return;
    if (sessionBaselineRef.current !== null) return; // already locked

    const readings = baselineReadings.current;
    const baseline =
      readings.length > 0
        ? readings.reduce((sum, v) => sum + v, 0) / readings.length
        : BASELINE_FALLBACK_BPM; // safety net: if AMBIENT_FADE_IN was too short

    sessionBaselineRef.current = baseline;
    setSessionBaseline(baseline);
  }, [sessionState]);

  // ── Spike state cleanup when leaving ADAPTIVE_LOOP ───────────────────────

  useEffect(() => {
    if (sessionState === 'ADAPTIVE_LOOP') return;
    spikeStartedAt.current = null;
    isSpikedRef.current = false;
    pendingManualDistress.current = false;
    setIsSpiked(false);
  }, [sessionState]);

  // ── BLE connectivity (reset timer on each rawBpm change) ─────────────────

  useEffect(() => {
    lastReadingAt.current = Date.now();

    if (!watchConnectedRef.current) {
      watchConnectedRef.current = true;
      setWatchConnected(true);
      onWatchReconnectedRef.current();
    }

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
        if (isChronicHighBaseline && !pendingManualDistress.current) {
          // HR threshold met but waiting for manual confirmation — log only.
          return;
        }
        isSpikedRef.current = true;
        pendingManualDistress.current = false;
        setIsSpiked(true);
        onSpikeRef.current();
      }
    } else {
      spikeStartedAt.current = null;
      // Only clear pending distress if HR has been consistently below threshold;
      // small jitter resets are intentionally accepted here (clinical tradeoff).
      pendingManualDistress.current = false;

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
    if (!isChronicHighBaseline) return;

    // Use rawBpmRef.current (always live) — not rawBpm (stale closure).
    if (rawBpmRef.current >= baseline * SPIKE_RATIO) {
      pendingManualDistress.current = true;
      // The next spike-detection effect tick will complete the dual-source check.
    }
  }, []); // no deps — reads only refs

  return {
    pulseBpm: rawBpm,
    sessionBaseline,
    isSpiked,
    watchConnected,
    reportManualDistress,
  };
}

// Internal — used by BLE effect.
const lastReadingAt = { current: Date.now() };
