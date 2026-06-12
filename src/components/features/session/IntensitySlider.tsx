import { useEffect } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";

import { fonts, tokens } from "@/lib/ui/tokens";

const TRACK_WIDTH = 220;
const THUMB_SIZE = 14;

type Props = {
  /** User's ceiling (0–1). */
  value: number;
  /** What the audio engine is actually outputting (0–1) — for the shadow indicator. */
  effective?: number;
  onChange: (value: number) => void;
};

export function IntensitySlider({ value, effective, onChange }: Props) {
  const { t } = useTranslation();
  const x = useSharedValue(value * TRACK_WIDTH);
  const startX = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(value * TRACK_WIDTH, { damping: 18, stiffness: 140 });
  }, [value, x]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = x.value;
    })
    .onUpdate((event) => {
      const next = Math.max(0, Math.min(TRACK_WIDTH, startX.value + event.translationX));
      x.value = next;
    })
    .onEnd(() => {
      runOnJS(onChange)(x.value / TRACK_WIDTH);
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value - THUMB_SIZE / 2 }],
  }));

  const effectiveLeft = (effective ?? value) * TRACK_WIDTH;

  return (
    <View className="items-center">
      <View className="flex-row items-center" style={{ width: TRACK_WIDTH + 140 }}>
        <Text
          style={{
            color: tokens.sceneTextMute,
            fontFamily: fonts.body,
            fontSize: 13,
            width: 60,
            textAlign: "right",
            paddingRight: 12,
          }}
        >
          {t("session.softer")}
        </Text>

        <GestureDetector gesture={pan}>
          <View
            style={{
              width: TRACK_WIDTH,
              height: 32,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                height: 1,
                width: TRACK_WIDTH,
                backgroundColor: tokens.sceneTextMute,
                opacity: 0.5,
              }}
            />
            {effective !== undefined && effective < value - 0.02 ? (
              <View
                style={{
                  position: "absolute",
                  left: effectiveLeft - THUMB_SIZE / 2,
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_SIZE / 2,
                  borderWidth: 1,
                  borderColor: tokens.sceneAccent,
                  opacity: 0.45,
                }}
              />
            ) : null}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  width: THUMB_SIZE,
                  height: THUMB_SIZE,
                  borderRadius: THUMB_SIZE / 2,
                  backgroundColor: tokens.sceneAccent,
                },
                thumbStyle,
              ]}
            />
          </View>
        </GestureDetector>

        <Text
          style={{
            color: tokens.sceneTextMute,
            fontFamily: fonts.body,
            fontSize: 13,
            width: 60,
            textAlign: "left",
            paddingLeft: 12,
          }}
        >
          {t("session.louder")}
        </Text>
      </View>
    </View>
  );
}
