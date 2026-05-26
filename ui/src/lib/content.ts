// Content provisioning seam.
//
// Today this returns bundled local data. Every getter is a swap point for a
// backend call — see the TODO(api) markers, each naming the endpoint from
// server/openapi.yaml that will eventually serve it. When the backend lands,
// only the bodies here change; call sites stay the same (they gain `await`).

import { ImageSourcePropType } from "react-native";

export type SceneKey = "river" | "park" | "cafe" | "road";
export type SoundKey =
  | "motorcycle"
  | "helicopter"
  | "fireworks"
  | "siren"
  | "backfire"
  | "shouting";
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
};

export type Preferences = {
  scene: SceneKey;
  sounds: SoundKey[];
};

export function localize(text: LocalizedText, lang: string): string {
  return lang === "he" ? text.he : text.en;
}

// TODO(api): GET /scenes — replace SCENES with the backend response.
const SCENES: Record<SceneKey, Scene> = {
  river: {
    key: "river",
    label: { en: "River walk, evening", he: "טיול לאורך הנהר, ערב" },
    short: { en: "River path", he: "שביל הנהר" },
    media: {
      still: "https://images.unsplash.com/photo-1502209524164-acea936639a2?w=900&q=80",
    },
    tint: { top: "#3A4F4A" },
    voice: {
      opening: {
        en: "You're walking\nalong the river.\nThe air is cool.",
        he: "אתה הולך\nלאורך הנהר.\nהאוויר קריר.",
      },
      during: {
        en: "The water keeps moving.\nA sound cuts across it.\nYou keep walking.",
        he: "המים ממשיכים לזרום.\nצליל חוצה אותם.\nאתה ממשיך ללכת.",
      },
      calming: {
        en: "That sound is part of the day.\nYou're still by the river.\nYou're still safe.",
        he: "הצליל הזה הוא חלק מהיום.\nאתה עדיין ליד הנהר.\nאתה עדיין בטוח.",
      },
    },
  },
  park: {
    key: "park",
    label: { en: "Park, evening", he: "פארק, ערב" },
    short: { en: "Park", he: "פארק" },
    media: {
      still: "https://images.unsplash.com/photo-1444930694458-01babe71870e?w=900&q=80",
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
      still: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80",
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
      still: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=80",
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

// TODO(api): GET /sounds — replace SOUNDS with the backend response
// (each will also carry audioUrl + durationMs).
const SOUNDS: Record<SoundKey, Sound> = {
  backfire: { key: "backfire", label: { en: "Car backfire", he: "פיצוץ מנוע" } },
  motorcycle: { key: "motorcycle", label: { en: "Motorcycle", he: "אופנוע" } },
  helicopter: { key: "helicopter", label: { en: "Helicopter", he: "מסוק" } },
  fireworks: { key: "fireworks", label: { en: "Fireworks", he: "זיקוקים" } },
  siren: { key: "siren", label: { en: "Siren", he: "סירנה" } },
  shouting: { key: "shouting", label: { en: "Shouting", he: "צעקות" } },
};

export const SCENE_ORDER: SceneKey[] = ["river", "park", "cafe", "road"];
export const SOUND_ORDER: SoundKey[] = [
  "backfire",
  "motorcycle",
  "helicopter",
  "fireworks",
  "siren",
  "shouting",
];

// TODO(api): GET /scenes
export function getScenes(): Scene[] {
  return SCENE_ORDER.map((k) => SCENES[k]);
}

export function getScene(key: SceneKey): Scene {
  return SCENES[key];
}

// TODO(api): GET /voice-lines?scene=&phase=&lang=
export function getVoiceScript(scene: SceneKey, phase: Phase, lang: string): string {
  return localize(SCENES[scene].voice[phase], lang);
}

// TODO(api): GET /sounds
export function getSounds(): Sound[] {
  return SOUND_ORDER.map((k) => SOUNDS[k]);
}

export function getSound(key: SoundKey): Sound {
  return SOUNDS[key];
}

// TODO(api): GET /preferences — the user's persisted scene + consented sounds.
export function getDefaultPreferences(): Preferences {
  return { scene: "park", sounds: ["motorcycle"] };
}
