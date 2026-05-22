import "@/global.css";

import { useEffect } from "react";
import { I18nManager, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  FrankRuhlLibre_400Regular,
  FrankRuhlLibre_500Medium,
} from "@expo-google-fonts/frank-ruhl-libre";
import { Heebo_400Regular, Heebo_500Medium } from "@expo-google-fonts/heebo";

import { isRTL } from "@/lib/i18n";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    FrankRuhlLibre_400Regular,
    FrankRuhlLibre_500Medium,
    Heebo_400Regular,
    Heebo_500Medium,
  });

  useEffect(() => {
    const shouldBeRTL = isRTL();
    if (I18nManager.isRTL !== shouldBeRTL) {
      I18nManager.allowRTL(shouldBeRTL);
      I18nManager.forceRTL(shouldBeRTL);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View className="flex-1 bg-bg" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#241B16" }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#241B16" },
          animation: "fade",
        }}
      />
    </GestureHandlerRootView>
  );
}
