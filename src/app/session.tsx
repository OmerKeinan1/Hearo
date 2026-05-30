import { useEffect, useMemo, useRef, useState } from "react";
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
import { useAudioPlayer } from "expo-audio";
import { useSessionStore } from "@/lib/session-store";
import { pickRandomTrigger } from "@/lib/audio";
import { getScene, getVoiceScript, localize, Phase, SceneKey } from "@/lib/content";
import { useCrisisStore } from "@/lib/crisis-store";
import { fonts, tokens } from "@/lib/tokens";
import { PulsePhase, usePulse } from "@/lib/pulse";

// TODO(supabase): `session_programs` table — these phase timings are a fixed
// demo script. A real version sources the program (durations, trigger
// placement) per scene from Supabase.
const SCRIPT: { at: number; phase: Phase; pulsePhase: PulsePhase; flash?: number }[] = [
  { at: 0, phase: "opening", pulsePhase: "baseline" },
  { at: 15000, phase: "during", pulsePhase: "rising", flash: 0.9 },
  { at: 30000, phase: "calming", pulsePhase: "peak" },
  { at: 50000, phase: "calming", pulsePhase: "settling" },
];

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const VALID_SCENES: SceneKey[] = ["beach", "park", "cafe", "road"];

export default function Session() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { scene: sceneParam } = useLocalSearchParams<{ scene?: string }>();
  const scene: SceneKey = VALID_SCENES.includes(sceneParam as SceneKey)
    ? (sceneParam as SceneKey)
    : "park";

  const [phase, setPhase] = useState<Phase>("opening");
  const [pulsePhase, setPulsePhase] = useState<PulsePhase>("baseline");
  const [flash, setFlash] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ceiling, setCeiling] = useState(0.65);
  const startedAt = useRef(Date.now());
  const scriptIndex = useRef(0);
  const pausedSince = useRef<number | null>(null);

  const isCrisisOpen = useCrisisStore((s) => s.isOpen);
  const pausedRef = useRef(false);

  const pulse = usePulse({ active: !isCrisisOpen, phase: pulsePhase });
  const slow = pulsePhase === "peak" || pulsePhase === "settling";

  // Trigger audio: pick one random variation of the user's first consented
  // sound on mount and stick with it for this session. Empty consent list →
  // null source = silent rehearsal walk.
  const consentedSounds = useSessionStore((s) => s.sounds);
  const [triggerSource] = useState(() => pickRandomTrigger(consentedSounds[0]));
  const audioPlayer = useAudioPlayer(triggerSource);

  useEffect(() => {
    pausedRef.current = isCrisisOpen;
    if (isCrisisOpen) {
      if (pausedSince.current === null) pausedSince.current = Date.now();
    } else if (pausedSince.current !== null) {
      startedAt.current += Date.now() - pausedSince.current;
      pausedSince.current = null;
    }
  }, [isCrisisOpen]);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const now = Date.now() - startedAt.current;
      setElapsed(now);
      const next = SCRIPT[scriptIndex.current + 1];
      if (next && next.at <= now) {
        scriptIndex.current += 1;
        setPhase(next.phase);
        setPulsePhase(next.pulsePhase);
        if (next.flash) setFlash(next.flash);
      }
    }, 250);
    return () => clearInterval(id);
  }, []);

  const voiceText = useMemo(
    () => getVoiceScript(scene, phase, i18n.language),
    [scene, phase, i18n.language],
  );

  const autoFloor = slow ? Math.min(ceiling, 0.35) : ceiling;
  const effective = autoFloor;
  const sceneLabel = localize(getScene(scene).label, i18n.language);

  // Start the trigger clip when entering the during phase.
  useEffect(() => {
    if (!triggerSource) return;
    if (phase === "during" && !isCrisisOpen) {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    }
  }, [phase, isCrisisOpen, triggerSource, audioPlayer]);

  // Volume tracks the effective ceiling (manual ceiling, possibly
  // further attenuated by the automatic pulse-driven floor).
  useEffect(() => {
    if (!triggerSource) return;
    audioPlayer.volume = effective;
  }, [effective, triggerSource, audioPlayer]);

  // Crisis-sheet pause: silence the clip and resume on dismiss.
  useEffect(() => {
    if (!triggerSource) return;
    if (isCrisisOpen) {
      audioPlayer.pause();
    } else if (phase === "during") {
      audioPlayer.play();
    }
  }, [isCrisisOpen, phase, triggerSource, audioPlayer]);

  return (
    <View className="flex-1 bg-bg">
      <SceneBackground scene={scene} intensity={slow ? 0.86 : 0.78} />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7">
          <View className="flex-row justify-between items-center pt-2">
            <CrisisAffordance tone="on-scene" />
            <Pressable hitSlop={16} onPress={() => router.back()}>
              <Icon name="close" size={20} color={tokens.sceneText} />
            </Pressable>
          </View>

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

          <View className="pt-16">
            <VoiceLine text={voiceText} />
          </View>

          <View className="flex-1 justify-center">
            <BreathingCircle flash={flash} slow={slow} paused={isCrisisOpen} />
          </View>

          <View className="pb-2">
            <IntensitySlider value={ceiling} effective={effective} onChange={setCeiling} />
          </View>

          <View className="pt-6">
            <View
              style={{
                height: 1,
                backgroundColor: tokens.sceneText,
                opacity: 0.25,
                width: "70%",
              }}
            />
            <Text
              style={{
                color: tokens.sceneText,
                fontFamily: fonts.body,
                fontSize: 13,
                marginTop: 8,
                opacity: 0.6,
              }}
            >
              {formatElapsed(elapsed)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center pt-4 pb-6">
            <PulseTicker value={pulse} />
            <Pressable hitSlop={12} onPress={() => router.push("/after")}>
              <Text
                style={{
                  color: tokens.text,
                  fontFamily: fonts.body,
                  fontSize: 16,
                  opacity: 0.85,
                }}
              >
                [ {t("session.pause")} ]
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
