// Audio playback for trigger sounds.
//
// The session screen creates one player via `useAudioPlayer(source)` (expo-audio
// auto-releases on unmount). At session mount time we pick a random variation
// of the chosen trigger sound — picking once and freezing the choice means the
// user can't anticipate the *exact* clip but the same clip plays consistently
// for the rest of that session. Unpredictability across sessions is part of
// the therapeutic exposure design.

import { AudioModule, getSound, SoundKey } from "@/lib/content";

/** Pick a random audio variation for a trigger sound. Returns null if the
 *  user has no consented trigger sound — in that case the session is a
 *  "rehearsal walk" with no exposure (exposure-session spec scenario:
 *  "Empty consent list"). */
export function pickRandomTrigger(soundKey: SoundKey | undefined): AudioModule | null {
  if (!soundKey) return null;
  const variations = getSound(soundKey).audioVariations;
  if (variations.length === 0) return null;
  return variations[Math.floor(Math.random() * variations.length)];
}
