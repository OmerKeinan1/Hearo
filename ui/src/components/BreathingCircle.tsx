import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { tokens } from "@/lib/tokens";

type Props = {
  /** Pulse intensity for the trigger flash (0–1). */
  flash?: number;
  /** Slow the cycle (used when auto-soften kicks in). */
  slow?: boolean;
};

export function BreathingCircle({ flash = 0, slow = false }: Props) {
  const scale = useSharedValue(0.6);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    const inhale = slow ? 5000 : 4000;
    const exhale = slow ? 8000 : 6000;
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: inhale, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.6, { duration: exhale, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [scale, slow]);

  useEffect(() => {
    if (flash > 0) {
      flashOpacity.value = withSequence(
        withTiming(flash, { duration: 200 }),
        withTiming(0, { duration: 1200 }),
      );
    }
  }, [flash, flashOpacity]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      className="w-44 h-44 items-center justify-center"
      style={{ alignSelf: "center" }}
    >
      <Animated.View
        style={[
          {
            width: 176,
            height: 176,
            borderRadius: 88,
            borderWidth: 1.5,
            borderColor: tokens.textMute,
            opacity: 0.55,
            position: "absolute",
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: 176,
            height: 176,
            borderRadius: 88,
            borderWidth: 2,
            borderColor: tokens.accent,
            position: "absolute",
          },
          flashStyle,
        ]}
      />
    </Animated.View>
  );
}
