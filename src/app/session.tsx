import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { BreathingCircle } from "@/components/BreathingCircle";
import { CrisisAffordance } from "@/components/CrisisAffordance";
import { Icon } from "@/components/Icon";
import { IntensitySlider } from "@/components/IntensitySlider";
import { PulseTicker } from "@/components/PulseTicker";
import { SceneBackground } from "@/components/SceneBackground";
import { VoiceLine } from "@/components/VoiceLine";
import { useSessionStore } from "@/lib/session-store";
import { getScene, getVoiceScript, localize, SceneKey, isPlaceholderSource, getAmbientTrack, getVoiceClips } from "@/lib/content";
import { dBToGain } from "@/lib/audio-engine";
import { useCrisisStore } from "@/lib/crisis-store";
import { fonts, tokens } from "@/lib/tokens";
import { usePulse, PulsePhase } from "@/lib/pulse";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { usePulseMonitor, SessionState } from "@/hooks/usePulseMonitor";
import { ensureAssets, AssetManifest } from "@/lib/asset-cache";

// ── Constants ────────────────────────────────────────────────────────────

const VALID_SCENES: SceneKey[] = ["beach", "park", "cafe", "road"];

// Duration of AMBIENT_FADE_IN before advancing to ADAPTIVE_LOOP.
// TODO(supabase): session_programs table — per-scene timing config.
const AMBIENT_FADE_IN_MS = 2 * 60 * 1000; // 2 minutes

// Total ADAPTIVE_LOOP duration (trigger ramp duration).
const ADAPTIVE_LOOP_MS = 8 * 60 * 1000; // 8 minutes

// dB ceiling per trigger sound type.
// TODO(supabase): sounds table — ceiling_db per sound key.
const TRIGGER_CEILING_DB: Record<string, number> = {
  motorcycle: 75,
  helicopter: 70,
  fireworks: 72,
  siren: 73,
  "car-horn": 70,
  "door-slam": 68,
};
const DEFAULT_CEILING_DB = 70;

// Manual distress auto-return after 90 seconds (no watch / watch disconnected).
const MANUAL_RETURN_MS = 90_000;

// ── Session state machine ─────────────────────────────────────────────────

type MachineState = SessionState;

type Action =
  | { type: "ASSETS_READY" }
  | { type: "DISCLAIMER_DONE" }
  | { type: "BASELINE_READY" }
  | { type: "SESSION_END" }
  | { type: "WIND_DOWN_DONE" }
  | { type: "FEEDBACK_SUBMITTED" };

function sessionReducer(state: MachineState, action: Action): MachineState {
  switch (state) {
    case "LOADING":
      if (action.type === "ASSETS_READY") return "DISCLAIMER";
      break;
    case "DISCLAIMER":
      if (action.type === "DISCLAIMER_DONE") return "AMBIENT_FADE_IN";
      break;
    case "AMBIENT_FADE_IN":
      if (action.type === "BASELINE_READY") return "ADAPTIVE_LOOP";
      if (action.type === "SESSION_END") return "WIND_DOWN";
      break;
    case "ADAPTIVE_LOOP":
      if (action.type === "SESSION_END") return "WIND_DOWN";
      break;
    case "WIND_DOWN":
      if (action.type === "WIND_DOWN_DONE") return "POST_SESSION";
      break;
    case "POST_SESSION":
      if (action.type === "FEEDBACK_SUBMITTED") return "POST_SESSION"; // handled in UI
      break;
  }
  return state;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function Session() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { scene: sceneParam } = useLocalSearchParams<{ scene?: string }>();
  const scene: SceneKey = VALID_SCENES.includes(sceneParam as SceneKey)
    ? (sceneParam as SceneKey)
    : "park";

  const consentedSounds = useSessionStore((s) => s.sounds);
  const isCrisisOpen = useCrisisStore((s) => s.isOpen);

  // ── Machine state ──────────────────────────────────────────────────────

  const [machineState, dispatch] = useReducer(sessionReducer, "LOADING");
  const machineStateRef = useRef<MachineState>("LOADING");
  useEffect(() => { machineStateRef.current = machineState; }, [machineState]);

  // ── UI state ───────────────────────────────────────────────────────────

  const [elapsed, setElapsed] = useState(0);
  const [ceiling, setCeiling] = useState(0.65);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [watchBanner, setWatchBanner] = useState<"no-watch" | "disconnected" | null>(null);
  // Manual distress countdown (seconds remaining, null when not active).
  const [manualCountdown, setManualCountdown] = useState<number | null>(null);

  const startedAt = useRef(Date.now());
  const pausedSince = useRef<number | null>(null);
  const manualReturnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualCountdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Audio engine ───────────────────────────────────────────────────────

  const engine = useAudioEngine();

  // ── Pulse monitor ──────────────────────────────────────────────────────

  const onSpike = useCallback(() => {
    if (machineStateRef.current !== "ADAPTIVE_LOOP") return;
    engine.onSpike();
  }, [engine]);

  const onNormalized = useCallback(() => {
    engine.onNormalized();
  }, [engine]);

  const onWatchDisconnected = useCallback(() => {
    setWatchBanner("disconnected");
  }, []);

  const onWatchReconnected = useCallback(() => {
    setWatchBanner(null);
    // Clear manual countdown when watch reconnects.
    if (manualReturnTimer.current) clearTimeout(manualReturnTimer.current);
    if (manualCountdownInterval.current) clearInterval(manualCountdownInterval.current);
    setManualCountdown(null);
  }, []);

  const { pulseBpm, sessionBaseline, isSpiked, watchConnected, reportManualDistress } =
    usePulseMonitor({
      sessionState: machineState,
      isSessionActive: !isCrisisOpen,
      onSpike,
      onNormalized,
      onWatchDisconnected,
      onWatchReconnected,
    });

  // Show no-watch banner on first render if no watch connected.
  useEffect(() => {
    if (!watchConnected && machineState === "DISCLAIMER") {
      setWatchBanner("no-watch");
    }
  }, [watchConnected, machineState]);

  // ── Session baseline → advance to ADAPTIVE_LOOP ────────────────────────

  useEffect(() => {
    if (sessionBaseline !== null && machineState === "AMBIENT_FADE_IN") {
      dispatch({ type: "BASELINE_READY" });
    }
  }, [sessionBaseline, machineState]);

  // Fallback: if AMBIENT_FADE_IN elapses with no baseline, advance anyway.
  useEffect(() => {
    if (machineState !== "AMBIENT_FADE_IN") return;
    const id = setTimeout(() => {
      if (machineStateRef.current === "AMBIENT_FADE_IN") {
        dispatch({ type: "BASELINE_READY" });
      }
    }, AMBIENT_FADE_IN_MS);
    return () => clearTimeout(id);
  }, [machineState]);

  // ── LOADING: verify/download assets ───────────────────────────────────

  useEffect(() => {
    if (machineState !== "LOADING") return;

    const ambientTrack = getAmbientTrack();
    const voiceClips = getVoiceClips();

    // Only include CDN assets (skip placeholders — no network call possible).
    const manifest: AssetManifest = [
      ...(!isPlaceholderSource(ambientTrack.source) && typeof ambientTrack.source === "string"
        ? [{ key: ambientTrack.key, url: ambientTrack.source, sha256: ambientTrack.sha256 ?? "" }]
        : []),
      ...voiceClips
        .filter((c) => !isPlaceholderSource(c.source) && typeof c.source === "string")
        .map((c) => ({ key: c.key, url: c.source as string, sha256: c.sha256 ?? "" })),
    ];

    (async () => {
      try {
        if (manifest.length > 0) {
          await ensureAssets(manifest, (done, total) => {
            setLoadProgress(done / total);
          });
        }
        dispatch({ type: "ASSETS_READY" });
      } catch (e) {
        setLoadError("Failed to download audio files. Check your connection and try again.");
      }
    })();
  }, [machineState]);

  // ── DISCLAIMER: play voice clip 0, start ambient ──────────────────────

  useEffect(() => {
    if (machineState !== "DISCLAIMER") return;

    engine.startAmbient();

    const voiceClips = getVoiceClips();
    const disclaimerClip = voiceClips[0];

    if (isPlaceholderSource(disclaimerClip.source)) {
      // No real asset yet — skip voice clip, go straight to AMBIENT_FADE_IN.
      dispatch({ type: "DISCLAIMER_DONE" });
      return;
    }

    engine
      .loadBuffers(
        getAmbientTrack().source as number,
        // Trigger buffer loaded lazily in ADAPTIVE_LOOP — not needed yet.
        "" as unknown as number,
        voiceClips.map((c) => c.source as number)
      )
      .then(() => engine.playVoiceClip(0))
      .then(() => dispatch({ type: "DISCLAIMER_DONE" }))
      .catch(() => dispatch({ type: "DISCLAIMER_DONE" })); // skip on error
  }, [machineState, engine]);

  // ── ADAPTIVE_LOOP: start trigger ramp ─────────────────────────────────

  useEffect(() => {
    if (machineState !== "ADAPTIVE_LOOP") return;

    const sound = consentedSounds[0];
    if (!sound) return; // rehearsal walk — no trigger

    const ceilingDb = TRIGGER_CEILING_DB[sound] ?? DEFAULT_CEILING_DB;

    engine.startTriggerRamp({
      durationSeconds: ADAPTIVE_LOOP_MS / 1000,
      ceilingGain: dBToGain(ceilingDb) * ceiling,
    });

    // Auto-advance to WIND_DOWN when the loop expires.
    const id = setTimeout(() => {
      if (machineStateRef.current === "ADAPTIVE_LOOP") {
        dispatch({ type: "SESSION_END" });
      }
    }, ADAPTIVE_LOOP_MS);
    return () => clearTimeout(id);
  }, [machineState, consentedSounds, ceiling, engine]);

  // MID_SESSION voice clip at 50% elapsed.
  const midSessionFiredRef = useRef(false);
  useEffect(() => {
    if (machineState !== "ADAPTIVE_LOOP" || midSessionFiredRef.current) return;
    const halfMs = ADAPTIVE_LOOP_MS / 2;
    const id = setTimeout(() => {
      midSessionFiredRef.current = true;
      const voiceClips = getVoiceClips();
      if (!isPlaceholderSource(voiceClips[1].source)) {
        engine.playVoiceClip(1).catch(() => {});
      }
    }, halfMs);
    return () => clearTimeout(id);
  }, [machineState, engine]);

  // ── WIND_DOWN: fade all audio, play wind-down clip ────────────────────

  useEffect(() => {
    if (machineState !== "WIND_DOWN") return;

    engine.fadeOutAll(3);

    const voiceClips = getVoiceClips();
    const windDownClip = voiceClips[2];

    setTimeout(() => {
      if (isPlaceholderSource(windDownClip.source)) {
        dispatch({ type: "WIND_DOWN_DONE" });
        return;
      }
      engine
        .playVoiceClip(2)
        .then(() => dispatch({ type: "WIND_DOWN_DONE" }))
        .catch(() => dispatch({ type: "WIND_DOWN_DONE" }));
    }, 3200); // after fade completes
  }, [machineState, engine]);

  // ── POST_SESSION → After screen ────────────────────────────────────────

  useEffect(() => {
    if (machineState === "POST_SESSION") {
      // TODO(post-session): show feedback form before routing.
      // For now route immediately; the feedback screen will be inserted here.
      router.push("/after");
    }
  }, [machineState, router]);

  // ── Intensity slider → engine ceiling ─────────────────────────────────

  useEffect(() => {
    engine.setTriggerCeiling(ceiling);
  }, [ceiling, engine]);

  // ── Crisis sheet pause/resume ─────────────────────────────────────────

  useEffect(() => {
    if (isCrisisOpen) {
      pausedSince.current = Date.now();
      engine.pauseAll();
    } else if (pausedSince.current !== null) {
      startedAt.current += Date.now() - pausedSince.current;
      pausedSince.current = null;
      engine.resumeAll();
    }
  }, [isCrisisOpen, engine]);

  // ── Elapsed timer ─────────────────────────────────────────────────────

  useEffect(() => {
    const active =
      machineState === "AMBIENT_FADE_IN" ||
      machineState === "ADAPTIVE_LOOP";
    if (!active) return;

    const id = setInterval(() => {
      if (!isCrisisOpen) {
        setElapsed(Date.now() - startedAt.current);
      }
    }, 250);
    return () => clearInterval(id);
  }, [machineState, isCrisisOpen]);

  // ── Manual distress (no watch / watch disconnected) ───────────────────

  const handleManualDistress = useCallback(() => {
    // For chronic high-baseline users, also notify the pulse monitor.
    reportManualDistress();

    // Silence trigger and start 90-second countdown.
    engine.onSpike();

    if (manualReturnTimer.current) clearTimeout(manualReturnTimer.current);
    if (manualCountdownInterval.current) clearInterval(manualCountdownInterval.current);

    let remaining = MANUAL_RETURN_MS / 1000;
    setManualCountdown(remaining);

    manualCountdownInterval.current = setInterval(() => {
      remaining -= 1;
      setManualCountdown(remaining);
      if (remaining <= 0) {
        if (manualCountdownInterval.current) clearInterval(manualCountdownInterval.current);
        manualCountdownInterval.current = null;
      }
    }, 1000);

    manualReturnTimer.current = setTimeout(() => {
      setManualCountdown(null);
      engine.onNormalized();
    }, MANUAL_RETURN_MS);
  }, [engine, reportManualDistress]);

  // Re-press resets countdown.
  const handleDistressPress = useCallback(() => {
    if (manualCountdown !== null) {
      // Already counting — reset.
      handleManualDistress();
    } else {
      handleManualDistress();
    }
  }, [manualCountdown, handleManualDistress]);

  // ── Derived display ───────────────────────────────────────────────────

  const voiceText = useMemo(() => {
    if (machineState === "AMBIENT_FADE_IN" || machineState === "LOADING" || machineState === "DISCLAIMER") {
      return getVoiceScript(scene, "opening", i18n.language);
    }
    if (machineState === "ADAPTIVE_LOOP") {
      return isSpiked
        ? getVoiceScript(scene, "calming", i18n.language)
        : getVoiceScript(scene, "during", i18n.language);
    }
    return getVoiceScript(scene, "calming", i18n.language);
  }, [machineState, scene, i18n.language, isSpiked]);

  const slow = machineState === "WIND_DOWN" || isSpiked;
  const sceneLabel = localize(getScene(scene).label, i18n.language);

  // ── Pulse mock phase (drives mock generator arc) ──────────────────────
  // usePulseMonitor handles this internally, so we just display pulseBpm.

  // ── LOADING screen ────────────────────────────────────────────────────

  if (machineState === "LOADING") {
    return (
      <View className="flex-1 bg-bg items-center justify-center">
        {loadError ? (
          <>
            <Text style={{ color: tokens.text, fontFamily: fonts.body, fontSize: 16 }}>
              {loadError}
            </Text>
            <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
              <Text style={{ color: tokens.accent, fontFamily: fonts.body, fontSize: 16 }}>
                {t("session.goBack")}
              </Text>
            </Pressable>
          </>
        ) : (
          <Text style={{ color: tokens.text, fontFamily: fonts.body, fontSize: 14, opacity: 0.6 }}>
            {t("session.preparing")}
            {loadProgress > 0 ? ` ${Math.round(loadProgress * 100)}%` : ""}
          </Text>
        )}
      </View>
    );
  }

  // ── Main session screen ───────────────────────────────────────────────

  return (
    <View className="flex-1 bg-bg">
      <SceneBackground scene={scene} intensity={slow ? 0.86 : 0.78} />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7">

          {/* Header */}
          <View className="flex-row justify-between items-center pt-2">
            <CrisisAffordance tone="on-scene" />
            <Pressable hitSlop={16} onPress={() => dispatch({ type: "SESSION_END" })}>
              <Icon name="close" size={20} color={tokens.sceneText} />
            </Pressable>
          </View>

          {/* Watch status banner */}
          {watchBanner !== null && (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 8 }}>
              <Text style={{ color: tokens.sceneText, fontFamily: fonts.body, fontSize: 12 }}>
                {watchBanner === "no-watch"
                  ? t("session.noWatch")
                  : t("session.watchDisconnected")}
              </Text>
            </View>
          )}

          {/* Scene label */}
          <View className="pt-8">
            <Text
              style={{
                color: tokens.sceneText,
                fontFamily: fonts.body,
                fontSize: 13,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                opacity: 0.65,
              }}
            >
              {sceneLabel}
            </Text>
          </View>

          {/* Voice caption */}
          <View className="pt-16">
            <VoiceLine text={voiceText} />
          </View>

          {/* Breathing circle */}
          <View className="flex-1 justify-center">
            <BreathingCircle
              flash={machineState === "ADAPTIVE_LOOP" && !isSpiked ? 0 : 0}
              slow={slow}
              paused={isCrisisOpen}
            />
          </View>

          {/* Manual distress / countdown (visible when no HR source) */}
          {(watchBanner !== null || !watchConnected) && machineState === "ADAPTIVE_LOOP" && (
            <View style={{ alignItems: "center", marginBottom: 8 }}>
              {manualCountdown !== null && (
                <Text style={{ color: tokens.sceneText, fontFamily: fonts.body, fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                  {t("session.triggerReturnsIn", { seconds: manualCountdown })}
                </Text>
              )}
              <Pressable
                hitSlop={12}
                onPress={handleDistressPress}
                style={{ padding: 8, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.35)" }}
              >
                <Text style={{ color: tokens.sceneText, fontFamily: fonts.body, fontSize: 14 }}>
                  {t("session.lowerSound")}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Intensity slider */}
          <View className="pb-2">
            <IntensitySlider value={ceiling} effective={ceiling} onChange={setCeiling} />
          </View>

          {/* Elapsed time */}
          <View className="pt-6">
            <View style={{ height: 1, backgroundColor: tokens.sceneText, opacity: 0.25, width: "70%" }} />
            <Text style={{ color: tokens.sceneText, fontFamily: fonts.body, fontSize: 13, marginTop: 8, opacity: 0.6 }}>
              {formatElapsed(elapsed)}
            </Text>
          </View>

          {/* Bottom row */}
          <View className="flex-row justify-between items-center pt-4 pb-6">
            <PulseTicker value={pulseBpm} />
            <Pressable hitSlop={12} onPress={() => dispatch({ type: "SESSION_END" })}>
              <Text style={{ color: tokens.text, fontFamily: fonts.body, fontSize: 16, opacity: 0.85 }}>
                [ {t("session.pause")} ]
              </Text>
            </Pressable>
          </View>

        </View>
      </SafeAreaView>
    </View>
  );
}
