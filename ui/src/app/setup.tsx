import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { CrisisAffordance } from "@/components/CrisisAffordance";
import { getScenes, getSounds, localize } from "@/lib/content";
import { useSessionStore } from "@/lib/session-store";
import { fonts, tokens } from "@/lib/tokens";

const SCENES = getScenes();
const SOUNDS = getSounds();

function Radio({ selected }: { selected: boolean }) {
  return (
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
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: tokens.accent,
          }}
        />
      ) : null}
    </View>
  );
}

function Check({ selected }: { selected: boolean }) {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 3,
        borderWidth: 1,
        borderColor: selected ? tokens.accent : tokens.textMute,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: selected ? tokens.accent : "transparent",
      }}
    >
      {selected ? (
        <Text style={{ color: tokens.bg, fontSize: 12, lineHeight: 12 }}>✓</Text>
      ) : null}
    </View>
  );
}

export default function Setup() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { scene, sounds, setScene, toggleSound } = useSessionStore();

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-8 pt-4 flex-row justify-between items-center">
          <CrisisAffordance />
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text
              style={{
                color: tokens.text,
                fontFamily: fonts.body,
                fontSize: 22,
              }}
            >
              ←
            </Text>
          </Pressable>
        </View>

        <View className="px-8 pt-6">
          <View style={{ width: 28, height: 1, backgroundColor: tokens.accent }} />
        </View>

        <Text
          style={{
            color: tokens.text,
            fontFamily: fonts.display,
            fontSize: 28,
            lineHeight: 38,
            marginTop: 24,
            marginBottom: 24,
            paddingHorizontal: 32,
          }}
        >
          {t("setup.sceneQuestion")}
        </Text>

        <View className="px-8">
          {SCENES.map((s) => {
            const selected = scene === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => setScene(s.key)}
                hitSlop={6}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}
              >
                <Radio selected={selected} />
                <Text
                  style={{
                    color: selected ? tokens.text : tokens.textMute,
                    fontFamily: fonts.body,
                    fontSize: 17,
                    marginLeft: 14,
                  }}
                >
                  {localize(s.label, i18n.language)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="px-8 pt-12">
          <View style={{ width: 28, height: 1, backgroundColor: tokens.textMute, opacity: 0.5 }} />
        </View>

        <Text
          style={{
            color: tokens.text,
            fontFamily: fonts.display,
            fontSize: 28,
            lineHeight: 38,
            marginTop: 24,
            marginBottom: 8,
            paddingHorizontal: 32,
          }}
        >
          {t("setup.soundsQuestion")}
        </Text>

        <Text
          style={{
            color: tokens.textMute,
            fontFamily: fonts.body,
            fontSize: 15,
            lineHeight: 22,
            paddingHorizontal: 32,
            marginBottom: 16,
          }}
        >
          {t("setup.soundsHint")}
        </Text>

        <View className="px-8">
          {SOUNDS.map((s) => {
            const selected = sounds.includes(s.key);
            return (
              <Pressable
                key={s.key}
                onPress={() => toggleSound(s.key)}
                hitSlop={6}
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}
              >
                <Check selected={selected} />
                <Text
                  style={{
                    color: selected ? tokens.text : tokens.textMute,
                    fontFamily: fonts.body,
                    fontSize: 17,
                    marginLeft: 14,
                  }}
                >
                  {localize(s.label, i18n.language)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="px-8 pt-12 pb-6">
          <Pressable
            onPress={() => router.push("/home")}
            hitSlop={8}
            style={{ opacity: sounds.length === 0 ? 0.4 : 1 }}
          >
            <Text
              style={{
                color: tokens.accent,
                fontFamily: fonts.body,
                fontSize: 22,
              }}
            >
              {t("setup.ready")}  →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
