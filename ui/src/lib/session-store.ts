import { create } from "zustand";

import { getDefaultPreferences, SceneKey, SoundKey } from "@/lib/content";

export type { SceneKey, SoundKey };

type SessionState = {
  scene: SceneKey;
  sounds: SoundKey[];
  setScene: (scene: SceneKey) => void;
  toggleSound: (sound: SoundKey) => void;
};

const defaults = getDefaultPreferences();

export const useSessionStore = create<SessionState>((set) => ({
  scene: defaults.scene,
  sounds: defaults.sounds,
  setScene: (scene) => set({ scene }),
  toggleSound: (sound) =>
    set((state) => ({
      sounds: state.sounds.includes(sound)
        ? state.sounds.filter((s) => s !== sound)
        : [...state.sounds, sound],
    })),
}));
