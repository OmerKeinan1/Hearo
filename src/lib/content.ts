// Content provisioning seam.
//
// Today this returns bundled local data. Every getter is a swap point for a
// Supabase query — see the TODO(supabase) markers, each naming the table /
// query that will eventually serve it. When the schema lands, only the
// bodies here change; call sites stay the same (they gain `await`).

import { ImageSourcePropType } from "react-native";

export type SceneKey = "beach" | "park" | "cafe" | "road";
export type SoundKey =
  | "motorcycle"
  | "helicopter"
  | "fireworks"
  | "siren"
  | "car-horn"
  | "door-slam";
// Note: dog, baby-crying, restaurant audio files remain on disk under
// ui/assets/sounds/triggers/ — these are off-persona for combat veterans
// (postpartum / K9 / social-anxiety trauma) but kept for a future expansion
// to other trauma profiles.

/** `require()` of a bundled mp3 returns a number from RN's asset registry. */
export type AudioModule = number;
export type Phase = "opening" | "during" | "calming";
export type Lang = "en" | "he";

export type LocalizedText = { en: string; he: string };

export type SceneMedia = {
  // TODO(asset): replace placeholder URIs with bundled, scene-accurate media in
  // ui/assets/scenes/ (still: require(...), video: require(...)). The scene tint
  // below is the guaranteed-correct fallback — it always renders the right mood
  // even if the image fails to load.
  still?: ImageSourcePropType | string;
  video?: ImageSourcePropType | string;
};

export type Scene = {
  key: SceneKey;
  label: LocalizedText;
  short: LocalizedText;
  media: SceneMedia;
  tint: { top: string };
  voice: Record<Phase, LocalizedText>;
};

export type Sound = {
  key: SoundKey;
  label: LocalizedText;
  // TODO(supabase): `sound_variations` table — each row a (sound_id, audio_url, duration_ms).
  // Variations exist so the user can't anticipate the exact clip — a small but
  // therapeutically meaningful unpredictability.
  audioVariations: AudioModule[];
};

export type Preferences = {
  scene: SceneKey;
  sounds: SoundKey[];
};

export function localize(text: LocalizedText, lang: string): string {
  return lang === "he" ? text.he : text.en;
}

// TODO(supabase): `scenes` table (+ join `scene_voice_lines` keyed by scene + phase + lang).
const SCENES: Record<SceneKey, Scene> = {
  beach: {
    key: "beach",
    label: { en: "Beach walk, evening", he: "טיול בחוף, ערב" },
    short: { en: "Beach", he: "חוף" },
    media: {
      still: require("@/assets/scenes/beach.png"),
    },
    tint: { top: "#3A4F4A" },
    voice: {
      opening: {
        en: "You're walking\nalong the beach.\nThe waves are quiet.",
        he: "אתה הולך\nלאורך החוף.\nהגלים שקטים.",
      },
      during: {
        en: "The water keeps moving.\nA sound cuts across it.\nYou keep walking.",
        he: "המים ממשיכים לזרום.\nצליל חוצה אותם.\nאתה ממשיך ללכת.",
      },
      calming: {
        en: "That sound is part of the day.\nYou're still by the water.\nYou're still safe.",
        he: "הצליל הזה הוא חלק מהיום.\nאתה עדיין ליד המים.\nאתה עדיין בטוח.",
      },
    },
  },
  park: {
    key: "park",
    label: { en: "Park, evening", he: "פארק, ערב" },
    short: { en: "Park", he: "פארק" },
    media: {
      still: require("@/assets/scenes/park.png"),
    },
    tint: { top: "#4A4A2C" },
    voice: {
      opening: {
        en: "You're walking\nthrough the park.\nThe evening is soft.",
        he: "אתה הולך\nדרך הפארק.\nהערב רך.",
      },
      during: {
        en: "The trees move around you.\nA sound breaks through.\nYou keep walking.",
        he: "העצים נעים סביבך.\nצליל פורץ.\nאתה ממשיך ללכת.",
      },
      calming: {
        en: "That sound belongs to the park.\nYou're still on the path.\nYou're still safe.",
        he: "הצליל הזה שייך לפארק.\nאתה עדיין על השביל.\nאתה עדיין בטוח.",
      },
    },
  },
  cafe: {
    key: "cafe",
    label: { en: "Cafe, morning", he: "בית קפה, בוקר" },
    short: { en: "Cafe", he: "בית קפה" },
    media: {
      still: require("@/assets/scenes/cafe.jpg"),
    },
    tint: { top: "#5A3D26" },
    voice: {
      opening: {
        en: "You're sitting\nin the cafe.\nThe morning is quiet.",
        he: "אתה יושב\nבבית הקפה.\nהבוקר שקט.",
      },
      during: {
        en: "The room hums around you.\nA sound rises over it.\nYou stay where you are.",
        he: "החדר הומה סביבך.\nצליל מתרומם מעליו.\nאתה נשאר במקומך.",
      },
      calming: {
        en: "That sound is part of the morning.\nYou're still in your seat.\nYou're still safe.",
        he: "הצליל הזה הוא חלק מהבוקר.\nאתה עדיין בכיסא שלך.\nאתה עדיין בטוח.",
      },
    },
  },
  road: {
    key: "road",
    label: { en: "Quiet road", he: "כביש שקט" },
    short: { en: "Quiet road", he: "כביש שקט" },
    media: {
      still: require("@/assets/scenes/road.jpg"),
    },
    tint: { top: "#3D332B" },
    voice: {
      opening: {
        en: "You're walking\nthe quiet road.\nThere's space around you.",
        he: "אתה הולך\nבכביש השקט.\nיש מרחב סביבך.",
      },
      during: {
        en: "The road stretches on.\nA sound arrives.\nYou keep walking.",
        he: "הכביש משתרע הלאה.\nצליל מגיע.\nאתה ממשיך ללכת.",
      },
      calming: {
        en: "That sound passes through.\nYou're still on the road.\nYou're still safe.",
        he: "הצליל הזה חולף.\nאתה עדיין על הכביש.\nאתה עדיין בטוח.",
      },
    },
  },
};

// TODO(supabase): `sounds` table — key, labels by lang.
// Variations live in `sound_variations` (sound_id → audio_url, duration_ms).
const SOUNDS: Record<SoundKey, Sound> = {
  motorcycle: {
    key: "motorcycle",
    label: { en: "Motorcycle", he: "אופנוע" },
    audioVariations: [
      require("@/assets/sounds/triggers/motorcycle/1.mp3"),
      require("@/assets/sounds/triggers/motorcycle/2.mp3"),
      require("@/assets/sounds/triggers/motorcycle/3.mp3"),
      require("@/assets/sounds/triggers/motorcycle/4.mp3"),
    ],
  },
  helicopter: {
    key: "helicopter",
    label: { en: "Helicopter", he: "מסוק" },
    audioVariations: [
      require("@/assets/sounds/triggers/helicopter/1.mp3"),
      require("@/assets/sounds/triggers/helicopter/2.mp3"),
    ],
  },
  fireworks: {
    key: "fireworks",
    label: { en: "Fireworks", he: "זיקוקים" },
    audioVariations: [
      require("@/assets/sounds/triggers/fireworks/1.mp3"),
      require("@/assets/sounds/triggers/fireworks/2.mp3"),
      require("@/assets/sounds/triggers/fireworks/3.mp3"),
      require("@/assets/sounds/triggers/fireworks/4.mp3"),
    ],
  },
  siren: {
    key: "siren",
    label: { en: "Siren", he: "סירנה" },
    audioVariations: [
      require("@/assets/sounds/triggers/siren/1.mp3"),
      require("@/assets/sounds/triggers/siren/2.mp3"),
      require("@/assets/sounds/triggers/siren/3.mp3"),
    ],
  },
  "car-horn": {
    key: "car-horn",
    label: { en: "Car horn", he: "צפירת מכונית" },
    audioVariations: [
      require("@/assets/sounds/triggers/car-horn/1.mp3"),
      require("@/assets/sounds/triggers/car-horn/2.mp3"),
    ],
  },
  "door-slam": {
    key: "door-slam",
    label: { en: "Door slam", he: "דלת נטרקת" },
    audioVariations: [
      require("@/assets/sounds/triggers/door-slam/1.mp3"),
      require("@/assets/sounds/triggers/door-slam/2.mp3"),
      require("@/assets/sounds/triggers/door-slam/3.mp3"),
      require("@/assets/sounds/triggers/door-slam/4.mp3"),
    ],
  },
};

export const SCENE_ORDER: SceneKey[] = ["beach", "park", "cafe", "road"];
// Ordered roughly by how commonly users encounter each trigger in daily urban
// life — most encountered first, so the picker reads as a familiar list.
export const SOUND_ORDER: SoundKey[] = [
  "motorcycle",
  "car-horn",
  "siren",
  "helicopter",
  "door-slam",
  "fireworks",
];

// TODO(supabase): `supabase.from('scenes').select('*, scene_voice_lines(*)')`
export function getScenes(): Scene[] {
  return SCENE_ORDER.map((k) => SCENES[k]);
}

export function getScene(key: SceneKey): Scene {
  return SCENES[key];
}

// TODO(supabase): `supabase.from('scene_voice_lines').select().eq('scene', scene).eq('phase', phase).eq('lang', lang).single()`
export function getVoiceScript(scene: SceneKey, phase: Phase, lang: string): string {
  return localize(SCENES[scene].voice[phase], lang);
}

// TODO(supabase): `supabase.from('sounds').select('*, sound_variations(*)')`
export function getSounds(): Sound[] {
  return SOUND_ORDER.map((k) => SOUNDS[k]);
}

export function getSound(key: SoundKey): Sound {
  return SOUNDS[key];
}

// TODO(supabase): `user_preferences` row keyed by `auth.uid()` — scene, consented sounds,
// learned intensity ceilings per sound.
export function getDefaultPreferences(): Preferences {
  return { scene: "park", sounds: ["motorcycle"] };
}

// ── Ambient tracks ────────────────────────────────────────────────────────

/** A looping ambient soundscape asset. */
export type AmbientTrack = {
  key: string;
  label: LocalizedText;
  // TODO(supabase): `ambient_tracks` table — key, labels, cdn_url, sha256.
  // AudioModule (require()) for the bundled fallback; string CDN URI otherwise.
  source: AudioModule | string;
  /** SHA-256 of the CDN file — used by asset-cache for freshness checks. */
  sha256?: string;
};

// One basic ambient track is bundled in the app to reduce onboarding friction
// and provide a fallback when the CDN is unreachable.
// TODO(asset): replace placeholder with the actual bundled ambient file once
// produced by the audio team.
const BUNDLED_AMBIENT: AmbientTrack = {
  key: "ambient/default",
  label: { en: "Calm ambience", he: "סביבה רגועה" },
  // TODO(asset): require("@/assets/sounds/ambient/default.m4a")
  source: "TODO_REPLACE_WITH_BUNDLED_ASSET",
};

// TODO(supabase): `supabase.from('ambient_tracks').select('*')`
export function getAmbientTrack(): AmbientTrack {
  return BUNDLED_AMBIENT;
}

// ── Voice clips ───────────────────────────────────────────────────────────

/** A pre-recorded voice clip played at specific session moments. */
export type VoiceClip = {
  key: "disclaimer" | "mid-session" | "wind-down";
  label: LocalizedText;
  // TODO(supabase): `voice_clips` table — key, lang, cdn_url, sha256, duration_ms.
  // Source can be a bundled AudioModule or a CDN URI string (MP3/MP4).
  source: AudioModule | string;
  sha256?: string;
  durationMs?: number;
};

export type VoiceClipKey = VoiceClip["key"];

// Voice clip order matches the playVoiceClip(index) contract in AudioEngine:
//   index 0 = DISCLAIMER, index 1 = MID_SESSION, index 2 = WIND_DOWN
// TODO(asset): replace placeholder sources with actual recordings once
// approved by the clinical team (Dudi Efrati).
const VOICE_CLIPS: VoiceClip[] = [
  {
    key: "disclaimer",
    label: {
      en: "Session intro",
      he: "פתיח הסשן",
    },
    // TODO(asset): require("@/assets/sounds/voice/disclaimer.mp3") or CDN URI
    source: "TODO_REPLACE_WITH_DISCLAIMER_ASSET",
  },
  {
    key: "mid-session",
    label: {
      en: "Halfway check-in",
      he: "מחצית הסשן",
    },
    source: "TODO_REPLACE_WITH_MID_SESSION_ASSET",
  },
  {
    key: "wind-down",
    label: {
      en: "Session close",
      he: "סיום הסשן",
    },
    source: "TODO_REPLACE_WITH_WIND_DOWN_ASSET",
  },
];

// TODO(supabase): `supabase.from('voice_clips').select('*').order('sort_order')`
export function getVoiceClips(): VoiceClip[] {
  return VOICE_CLIPS;
}
