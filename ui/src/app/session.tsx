import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { BreathingCircle } from "@/components/BreathingCircle";
import { IntensitySlider } from "@/components/IntensitySlider";
import { PulseTicker } from "@/components/PulseTicker";
import { SceneBackground, SceneKey } from "@/components/SceneBackground";
import { VoiceLine } from "@/components/VoiceLine";
import { fonts, tokens } from "@/lib/tokens";
import { PulsePhase, usePulse } from "@/lib/pulse";

type Phase = "opening" | "during" | "calming";

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

const VALID_SCENES: SceneKey[] = ["river", "park", "cafe", "road"];

export default function Session() {
  const router = useRouter();
  const { t } = useTranslation();
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

  const pulse = usePulse({ active: true, phase: pulsePhase });
  const slow = pulsePhase === "peak" || pulsePhase === "settling";

  useEffect(() => {
    const timers = SCRIPT.map((step) =>
      setTimeout(() => {
        setPhase(step.phase);
        setPulsePhase(step.pulsePhase);
        if (step.flash) setFlash(step.flash);
      }, step.at),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - startedAt.current);
    }, 250);
    return () => clearInterval(id);
  }, []);

  const voiceText = useMemo(() => {
    if (phase === "opening") return t("session.voice.opening");
    if (phase === "during") return t("session.voice.during");
    return t("session.voice.calming");
  }, [phase, t]);

  const autoFloor = slow ? Math.min(ceiling, 0.35) : ceiling;
  const effective = autoFloor;
  const sceneLabel = t(`scenes.${scene}.label` as const, {
    defaultValue: t("session.scene"),
  });

  return (
    <View className="flex-1 bg-bg">
      <SceneBackground scene={scene} intensity={slow ? 0.86 : 0.78} />
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-7">
          <View className="flex-row justify-between items-center pt-2">
            <Pressable hitSlop={16} onPress={() => {}}>
              <Text
                style={{
                  color: tokens.text,
                  fontFamily: fonts.body,
                  fontSize: 18,
                  opacity: 0.7,
                }}
              >
                i
              </Text>
            </Pressable>
            <Pressable hitSlop={16} onPress={() => router.back()}>
              <Text
                style={{
                  color: tokens.text,
                  fontFamily: fonts.body,
                  fontSize: 22,
                  opacity: 0.7,
                }}
              >
                ×
              </Text>
            </Pressable>
          </View>

          <View className="pt-8">
            <Text
              style={{
                color: tokens.text,
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
            <BreathingCircle flash={flash} slow={slow} />
          </View>

          <View className="pb-2">
            <IntensitySlider value={ceiling} effective={effective} onChange={setCeiling} />
          </View>

          <View className="pt-6">
            <View
              style={{
                height: 1,
                backgroundColor: tokens.text,
                opacity: 0.25,
                width: "70%",
              }}
            />
            <Text
              style={{
                color: tokens.text,
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
