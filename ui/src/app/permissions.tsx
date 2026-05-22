import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { fonts, tokens } from "@/lib/tokens";

type Status = "idle" | "granted";

function PermissionRow({
  title,
  why,
  cta,
  status,
  onPress,
}: {
  title: string;
  why: string;
  cta: string;
  status: Status;
  onPress: () => void;
}) {
  const granted = status === "granted";
  return (
    <View className="mb-12">
      <Text
        style={{
          color: tokens.text,
          fontFamily: fonts.display,
          fontSize: 22,
          marginBottom: 8,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          color: tokens.textMute,
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          marginBottom: 16,
        }}
      >
        {why}
      </Text>
      <Pressable onPress={granted ? undefined : onPress} hitSlop={8}>
        <View
          style={{
            borderWidth: 1,
            borderColor: granted ? tokens.accentSoft : tokens.accent,
            borderRadius: 999,
            paddingVertical: 12,
            paddingHorizontal: 20,
            alignSelf: "flex-start",
            opacity: granted ? 0.55 : 1,
          }}
        >
          <Text
            style={{
              color: granted ? tokens.accentSoft : tokens.accent,
              fontFamily: fonts.body,
              fontSize: 15,
            }}
          >
            {granted ? "✓  " + cta : cta}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function Permissions() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pulseStatus, setPulseStatus] = useState<Status>("idle");
  const [notifsStatus, setNotifsStatus] = useState<Status>("idle");

  const canContinue = pulseStatus === "granted" && notifsStatus === "granted";

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-1 px-8">
        <View className="pt-6">
          <View style={{ width: 28, height: 1, backgroundColor: tokens.accent }} />
        </View>

        <Text
          style={{
            color: tokens.text,
            fontFamily: fonts.display,
            fontSize: 30,
            lineHeight: 40,
            marginTop: 24,
            marginBottom: 40,
          }}
        >
          {t("permissions.title")}
        </Text>

        <PermissionRow
          title={t("permissions.pulseTitle")}
          why={t("permissions.pulseWhy")}
          cta={t("permissions.pulseAllow")}
          status={pulseStatus}
          onPress={() => setPulseStatus("granted")}
        />

        <PermissionRow
          title={t("permissions.notifsTitle")}
          why={t("permissions.notifsWhy")}
          cta={t("permissions.notifsAllow")}
          status={notifsStatus}
          onPress={() => setNotifsStatus("granted")}
        />

        <View className="flex-1" />

        <Text
          style={{
            color: tokens.textMute,
            fontFamily: fonts.body,
            fontSize: 13,
            marginBottom: 24,
          }}
        >
          {t("permissions.privacy")}
        </Text>

        <Pressable
          onPress={() => router.push("/setup")}
          hitSlop={8}
          style={{ paddingBottom: 16, opacity: canContinue ? 1 : 0.4 }}
        >
          <Text
            style={{
              color: tokens.accent,
              fontFamily: fonts.body,
              fontSize: 22,
            }}
          >
            {t("permissions.continue")}  →
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
