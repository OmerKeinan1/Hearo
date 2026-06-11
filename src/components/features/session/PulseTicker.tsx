import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { fonts, tokens } from "@/lib/ui/tokens";

type Props = {
  value: number;
  /** "mock" surfaces a tiny "(rehearsal)" tag so the user (and clinicians)
   *  can tell when the pulse isn't coming from a real watch. */
  source?: "real" | "mock";
};

export function PulseTicker({ value, source = "real" }: Props) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-baseline">
      <Text
        style={{
          color: tokens.sceneTextMute,
          fontFamily: fonts.body,
          fontSize: 13,
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {t("session.pulse")}
      </Text>
      <Text
        style={{
          color: tokens.sceneAccent,
          fontFamily: fonts.bodyMedium,
          fontSize: 28,
          marginLeft: 10,
        }}
      >
        {value}
      </Text>
      {source === "mock" ? (
        <Text
          style={{
            color: tokens.sceneTextMute,
            fontFamily: fonts.body,
            fontSize: 11,
            letterSpacing: 0.6,
            marginLeft: 8,
            opacity: 0.7,
          }}
        >
          ({t("session.pulseRehearsal")})
        </Text>
      ) : null}
    </View>
  );
}
