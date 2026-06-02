import {
  localize,
  getScenes,
  getScene,
  getSounds,
  getSound,
  getVoiceScript,
  getDefaultPreferences,
  SCENE_ORDER,
  SOUND_ORDER,
} from "@/lib/content";
import type { Phase } from "@/lib/content";

describe("content / localize", () => {
  const text = { en: "Hello", he: "שלום" };

  it("returns Hebrew for 'he'", () => {
    expect(localize(text, "he")).toBe("שלום");
  });
  it("returns English for 'en'", () => {
    expect(localize(text, "en")).toBe("Hello");
  });
  it("falls back to English for any non-'he' lang", () => {
    expect(localize(text, "fr")).toBe("Hello");
    expect(localize(text, "")).toBe("Hello");
  });
});

describe("content / scenes", () => {
  it("getScenes returns scenes in SCENE_ORDER", () => {
    expect(getScenes().map((s) => s.key)).toEqual(SCENE_ORDER);
  });

  it("getScene resolves every scene key", () => {
    for (const key of SCENE_ORDER) {
      expect(getScene(key).key).toBe(key);
    }
  });

  it("getVoiceScript returns non-empty, locale-distinct text for every phase", () => {
    const phases: Phase[] = ["opening", "during", "calming"];
    for (const scene of SCENE_ORDER) {
      for (const phase of phases) {
        const en = getVoiceScript(scene, phase, "en");
        const he = getVoiceScript(scene, phase, "he");
        expect(en.length).toBeGreaterThan(0);
        expect(he.length).toBeGreaterThan(0);
        expect(he).not.toBe(en);
      }
    }
  });
});

describe("content / sounds", () => {
  it("getSounds returns sounds in SOUND_ORDER", () => {
    expect(getSounds().map((s) => s.key)).toEqual(SOUND_ORDER);
  });

  it("getSound resolves every sound key", () => {
    for (const key of SOUND_ORDER) {
      expect(getSound(key).key).toBe(key);
    }
  });

  it("every sound has at least one audio variation", () => {
    for (const key of SOUND_ORDER) {
      expect(getSound(key).audioVariations.length).toBeGreaterThan(0);
    }
  });
});

describe("content / default preferences", () => {
  it("returns a valid scene and a sound subset", () => {
    const prefs = getDefaultPreferences();
    expect(SCENE_ORDER).toContain(prefs.scene);
    for (const sound of prefs.sounds) {
      expect(SOUND_ORDER).toContain(sound);
    }
  });
});
