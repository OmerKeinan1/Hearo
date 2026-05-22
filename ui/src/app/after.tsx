import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { fonts, tokens } from "@/lib/tokens";

type Reflection = "stillHere" | "shaken" | "steady";

const SPARK = [72, 74, 79, 88, 96, 108, 112, 105, 94, 86, 78, 74];

function Sparkline() {
  const min = Math.min(...SPARK);
  const max = Math.max(...SPARK);
  const range = max - min;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: 48 }}>
      {SPARK.map((value, idx) => {
        const normalized = (value - min) / range;
        const height = 8 + normalized * 38;
        return (
          <View
            key={idx}
            style={{
              width: 6,
              height,
              marginRight: 6,
              borderRadius: 2,
              backgroundColor: tokens.accent,
              opacity: 0.55 + normalized * 0.45,
            }}
          />
        );
      })}
    </View>
  );
}

function Option({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12 }}
    >
      <View
        style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 1,
          borderColor: selected ? tokens.accent : tokens.textMute,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected ? (
          <View
            style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tokens.accent }}
          />
        ) : null}
      </View>
      <Text
        style={{
          color: selected ? tokens.text : tokens.textMute,
          fontFamily: fonts.body,
          fontSize: 17,
          marginLeft: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function After() {
  const router = useRouter();
  const { t } = useTranslation();
  const [choice, setChoice] = useState<Reflection | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-8">
        <View className="pt-12">
          <View style={{ width: 28, height: 1, backgroundColor: tokens.accent }} />
        </View>

        <Text
          style={{
            color: tokens.text,
            fontFamily: fonts.display,
            fontSize: 30,
            lineHeight: 42,
            marginTop: 24,
          }}
        >
          {t("after.duration")}
        </Text>

        <View style={{ marginTop: 48 }}>
          <Text
            style={{
              color: tokens.textMute,
              fontFamily: fonts.body,
              fontSize: 13,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            {t("after.pulseLabel")}
          </Text>
          <Sparkline />
          <View style={{ flexDirection: "row", marginTop: 14 }}>
            <Text
              style={{
                color: tokens.textMute,
                fontFamily: fonts.body,
                fontSize: 15,
              }}
            >
              {SPARK[0]}   ··   {Math.max(...SPARK)}   ··   {SPARK[SPARK.length - 1]}
            </Text>
          </View>
        </View>

        <View className="pt-12">
          <View style={{ width: 28, height: 1, backgroundColor: tokens.textMute, opacity: 0.5 }} />
        </View>

        <Text
          style={{
            color: tokens.text,
            fontFamily: fonts.display,
            fontSize: 26,
            marginTop: 24,
            marginBottom: 8,
          }}
        >
          {t("after.reflectionQuestion")}
        </Text>

        <View>
          <Option
            label={t("after.stillHere")}
            selected={choice === "stillHere"}
            onPress={() => setChoice("stillHere")}
          />
          <Option
            label={t("after.shaken")}
            selected={choice === "shaken"}
            onPress={() => setChoice("shaken")}
          />
          <Option
            label={t("after.steady")}
            selected={choice === "steady"}
            onPress={() => setChoice("steady")}
          />
        </View>

        <View className="flex-1" />

        <Pressable
          onPress={() => router.replace("/home")}
          hitSlop={8}
          style={{ paddingBottom: 24, opacity: choice ? 1 : 0.4 }}
        >
          <Text
            style={{
              color: tokens.accent,
              fontFamily: fonts.body,
              fontSize: 22,
            }}
          >
            {t("after.done")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
