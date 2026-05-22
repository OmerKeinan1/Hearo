import { Text, View } from "react-native";
import { useTranslation } from "react-i18next";

import { fonts, tokens } from "@/lib/tokens";

type Props = {
  value: number;
};

export function PulseTicker({ value }: Props) {
  const { t } = useTranslation();
  return (
    <View className="flex-row items-baseline">
      <Text
        style={{
          color: tokens.textMute,
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
          color: tokens.accent,
          fontFamily: fonts.bodyMedium,
          fontSize: 28,
          marginLeft: 10,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
