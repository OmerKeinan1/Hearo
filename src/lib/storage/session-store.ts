import { create } from "zustand";

import { getDefaultPreferences, SceneKey, SoundKey } from "@/lib/content/content";

export type { SceneKey, SoundKey };

/** How the most recent session ended. `null` means no session has ended in
 *  this app session (cleared on app restart — sessions aren't persisted yet).
 *  The seam exists today so the calming-protocol exit can be distinguished
 *  from natural/manual exits. When session telemetry lands, this becomes one
 *  row in a session-records table. */
export type SessionEndedBy = "natural" | "manual-exit" | "calming-protocol";

type SessionState = {
  scene: SceneKey;
  sounds: SoundKey[];
  lastEndedBy: SessionEndedBy | null;
  setScene: (scene: SceneKey) => void;
  toggleSound: (sound: SoundKey) => void;
  setLastEndedBy: (endedBy: SessionEndedBy) => void;
};

const defaults = getDefaultPreferences();

export const useSessionStore = create<SessionState>((set) => ({
  scene: defaults.scene,
  sounds: defaults.sounds,
  lastEndedBy: null,
  setScene: (scene) => set({ scene }),
  toggleSound: (sound) =>
    set((state) => ({
      sounds: state.sounds.includes(sound)
        ? state.sounds.filter((s) => s !== sound)
        : [...state.sounds, sound],
    })),
  setLastEndedBy: (endedBy) => set({ lastEndedBy: endedBy }),
}));
