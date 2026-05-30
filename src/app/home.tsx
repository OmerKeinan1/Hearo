import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { CrisisAffordance } from "@/components/CrisisAffordance";
import { Icon } from "@/components/Icon";
import { getScene, getSound, localize } from "@/lib/content";
import { useSessionStore } from "@/lib/session-store";
import { fonts, tokens } from "@/lib/tokens";

export default function Home() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { scene, sounds } = useSessionStore();

  const sceneShort = localize(getScene(scene).short, i18n.language);
  const primarySound = sounds[0];
  const withLine = primarySound
    ? t("home.withSound", {
        sound: localize(getSound(primarySound).label, i18n.language).toLowerCase(),
      })
    : null;

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-8">
        <View className="flex-row justify-between items-center pt-2">
          <CrisisAffordance />
          <Pressable hitSlop={16} onPress={() => router.push("/setup")}>
            <Icon name="menu" size={22} color={tokens.text} />
          </Pressable>
        </View>

        <View className="pt-10">
          <View style={{ width: 28, height: 1, backgroundColor: tokens.accent }} />
        </View>

        {/* TODO(api): GET /users/me — the name "Shai" is hard-coded in the
            home.greeting i18n string. Replace with the user's displayName. */}
        <Text
          style={{
            color: tokens.text,
            fontFamily: fonts.display,
            fontSize: 32,
            lineHeight: 44,
            marginTop: 24,
          }}
        >
          {t("home.greeting")}
        </Text>

        <View className="flex-1 justify-center">
          <Text
            style={{
              color: tokens.textMute,
              fontFamily: fonts.body,
              fontSize: 13,
              letterSpacing: 1.6,
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            {t("home.todaysWalk")}
          </Text>

          <Text
            style={{
              color: tokens.text,
              fontFamily: fonts.display,
              fontSize: 30,
              lineHeight: 40,
            }}
          >
            {sceneShort}
          </Text>

          {withLine ? (
            <Text
              style={{
                color: tokens.textMute,
                fontFamily: fonts.body,
                fontSize: 18,
                marginTop: 4,
              }}
            >
              {withLine}
            </Text>
          ) : null}

          <Text
            style={{
              color: tokens.textMute,
              fontFamily: fonts.body,
              fontSize: 15,
              marginTop: 16,
            }}
          >
            {t("home.durationHint")}
          </Text>
        </View>

        <View className="pb-2">
          <Pressable
            onPress={() => router.push({ pathname: "/session", params: { scene } })}
            hitSlop={8}
            style={{
              borderWidth: 1,
              borderColor: tokens.accent,
              borderRadius: 999,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: tokens.accent,
                fontFamily: fonts.body,
                fontSize: 18,
              }}
            >
              {t("home.begin")}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => router.push("/setup")}
          hitSlop={8}
          style={{ alignSelf: "center", paddingVertical: 18 }}
        >
          <Text
            style={{
              color: tokens.textMute,
              fontFamily: fonts.body,
              fontSize: 14,
            }}
          >
            {t("home.change")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
