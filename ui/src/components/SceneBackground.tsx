import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ImageSourcePropType, View } from "react-native";

import { tokens } from "@/lib/tokens";

export type SceneKey = "river" | "park" | "cafe" | "road";

type SceneTint = {
  /** Image (optional). When provided, it sits under the gradient overlay. */
  image?: string | ImageSourcePropType;
  /** Top color of the gradient that hints at scene mood (sky / atmosphere). */
  top: string;
  /** Bottom color of the gradient (ground / closer to user). */
  bottom: string;
};

const SCENES: Record<SceneKey, SceneTint> = {
  river: {
    image: "https://images.unsplash.com/photo-1502209524164-acea936639a2?w=900&q=80",
    top: "#3A4F4A",
    bottom: tokens.bgDeep,
  },
  park: {
    image: "https://images.unsplash.com/photo-1444930694458-01babe71870e?w=900&q=80",
    top: "#4A4A2C",
    bottom: tokens.bgDeep,
  },
  cafe: {
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80",
    top: "#5A3D26",
    bottom: tokens.bgDeep,
  },
  road: {
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=80",
    top: "#3D332B",
    bottom: tokens.bgDeep,
  },
};

type Props = {
  scene: SceneKey;
  /** Strength of the dark overlay (0–1). Higher = imagery more muted. */
  intensity?: number;
};

export function SceneBackground({ scene, intensity = 0.78 }: Props) {
  const { image, top, bottom } = SCENES[scene];
  const overlayBottom = `rgba(26, 19, 16, ${Math.min(1, intensity + 0.08)})`;
  const overlayMiddle = `rgba(36, 27, 22, ${intensity})`;
  const overlayTop = `rgba(36, 27, 22, ${Math.min(1, intensity + 0.04)})`;

  return (
    <View style={{ ...StyleSheetAbsolute }}>
      <LinearGradient
        colors={[top, bottom]}
        style={{ ...StyleSheetAbsolute }}
      />
      {image ? (
        <Image
          source={typeof image === "string" ? { uri: image } : image}
          style={{ ...StyleSheetAbsolute }}
          contentFit="cover"
          transition={600}
        />
      ) : null}
      <LinearGradient
        colors={[overlayTop, overlayMiddle, overlayBottom]}
        locations={[0, 0.45, 1]}
        style={{ ...StyleSheetAbsolute }}
      />
    </View>
  );
}

const StyleSheetAbsolute = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
