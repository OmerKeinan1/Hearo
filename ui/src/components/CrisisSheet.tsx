import { useEffect } from "react";
import { Dimensions, Linking, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { CRISIS_NUMBER, useCrisisStore } from "@/lib/crisis-store";
import { fonts, tokens } from "@/lib/tokens";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = Math.min(SCREEN_HEIGHT * 0.7, 520);
const SLIDE_MS = 600;

export function CrisisSheet() {
  const { t } = useTranslation();
  const isOpen = useCrisisStore((s) => s.isOpen);
  const showingTrustedStub = useCrisisStore((s) => s.showingTrustedStub);
  const close = useCrisisStore((s) => s.close);
  const showTrustedStub = useCrisisStore((s) => s.showTrustedStub);

  const translateY = useSharedValue(SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (isOpen) {
      translateY.value = withTiming(0, {
        duration: SLIDE_MS,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0.55, { duration: SLIDE_MS });
    } else {
      translateY.value = withTiming(SHEET_HEIGHT, {
        duration: SLIDE_MS,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(0, { duration: SLIDE_MS });
    }
  }, [isOpen, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const onCall = () => {
    Linking.openURL(`tel:${CRISIS_NUMBER}`).catch(() => {});
  };

  return (
    <View
      pointerEvents={isOpen ? "auto" : "none"}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        elevation: 1000,
      }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#000",
          },
          backdropStyle,
        ]}
      >
        <Pressable
          onPress={close}
          style={{ flex: 1 }}
          accessibilityLabel="close crisis support"
        />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: SHEET_HEIGHT,
            backgroundColor: tokens.bgElev,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 32,
            paddingTop: 36,
            paddingBottom: 28,
          },
          sheetStyle,
        ]}
      >
        <Text
          style={{
            color: tokens.text,
            fontFamily: fonts.display,
            fontSize: 28,
            lineHeight: 38,
          }}
        >
          {t("crisis.title")}
        </Text>

        <View style={{ flex: 1, justifyContent: "center" }}>
          {!showingTrustedStub ? (
            <Pressable onPress={onCall} hitSlop={8}>
              <Text
                style={{
                  color: tokens.accent,
                  fontFamily: fonts.displayMedium,
                  fontSize: 30,
                  lineHeight: 40,
                }}
              >
                {t("crisis.call")} {t("crisis.number")}
              </Text>
              <Text
                style={{
                  color: tokens.textMute,
                  fontFamily: fonts.body,
                  fontSize: 14,
                  lineHeight: 20,
                  marginTop: 8,
                }}
              >
                {t("crisis.free")}
              </Text>
            </Pressable>
          ) : (
            <Text
              style={{
                color: tokens.text,
                fontFamily: fonts.display,
                fontSize: 22,
                lineHeight: 32,
              }}
            >
              {t("crisis.trustedStub")}
            </Text>
          )}
        </View>

        <View
          style={{
            height: 1,
            backgroundColor: tokens.textMute,
            opacity: 0.25,
            marginVertical: 18,
          }}
        />

        {!showingTrustedStub ? (
          <Pressable
            onPress={showTrustedStub}
            hitSlop={8}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Text
              style={{
                color: tokens.text,
                fontFamily: fonts.body,
                fontSize: 17,
              }}
            >
              {t("crisis.trusted")}
            </Text>
            <Text
              style={{
                color: tokens.textMute,
                fontFamily: fonts.body,
                fontSize: 17,
                marginLeft: 10,
              }}
            >
              ›
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={close}
          hitSlop={12}
          style={{ marginTop: 24, alignSelf: "flex-start" }}
        >
          <Text
            style={{
              color: tokens.textMute,
              fontFamily: fonts.body,
              fontSize: 15,
            }}
          >
            {t("crisis.close")}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
