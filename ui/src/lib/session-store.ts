import { create } from "zustand";

import { SceneKey } from "@/components/SceneBackground";

export type SoundKey = "motorcycle" | "helicopter" | "fireworks" | "siren" | "backfire" | "shouting";

type SessionState = {
  scene: SceneKey;
  sounds: SoundKey[];
  setScene: (scene: SceneKey) => void;
  toggleSound: (sound: SoundKey) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  scene: "park",
  sounds: ["motorcycle"],
  setScene: (scene) => set({ scene }),
  toggleSound: (sound) =>
    set((state) => ({
      sounds: state.sounds.includes(sound)
        ? state.sounds.filter((s) => s !== sound)
        : [...state.sounds, sound],
    })),
}));
