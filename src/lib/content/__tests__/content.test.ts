import {
  localize,
  getScenes,
  getScene,
  getSounds,
  getSound,
  getVoiceScript,
  getDefaultPreferences,
  getAmbientTrack,
  getVoiceClips,
  getPsychoEducation,
  getCalmingProtocol,
  isPlaceholderSource,
  SCENE_ORDER,
  SOUND_ORDER,
} from "@/lib/content/content";
import type { Phase } from "@/lib/content/content";

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

describe("content / session audio sources", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("identifies unresolved TODO source placeholders only", () => {
    expect(isPlaceholderSource("TODO_REPLACE_WITH_AUDIO")).toBe(true);
    expect(isPlaceholderSource("https://cdn.example.com/audio.mp3")).toBe(false);
    expect(isPlaceholderSource(1)).toBe(false);
  });

  it("returns a bundled ambient track for every scene", () => {
    jest.spyOn(Math, "random").mockReturnValue(0);

    for (const scene of SCENE_ORDER) {
      const track = getAmbientTrack(scene);
      expect(track.key).toBe(`ambient/${scene}`);
      expect(track.label.en.length).toBeGreaterThan(0);
      expect(track.label.he.length).toBeGreaterThan(0);
      expect(track.source).toBe(1);
      expect(isPlaceholderSource(track.source)).toBe(false);
    }
  });

  it("keeps voice clip order stable and marks missing recordings as placeholders", () => {
    const clips = getVoiceClips();
    expect(clips.map((clip) => clip.key)).toEqual([
      "disclaimer",
      "mid-session",
      "wind-down",
    ]);

    for (const clip of clips) {
      expect(clip.label.en.length).toBeGreaterThan(0);
      expect(clip.label.he.length).toBeGreaterThan(0);
      expect(isPlaceholderSource(clip.source)).toBe(true);
    }
  });
});

// B-02: the psycho-ed screen reads from this getter. Asserts the content
// shape AND that both languages are populated (the EN translation drift
// against HE source is the regression risk).
describe("content / psycho-education", () => {
  it("exposes eyebrow, heading, body, and continueLabel in both languages", () => {
    const p = getPsychoEducation();
    expect(p.eyebrow.en.length).toBeGreaterThan(0);
    expect(p.eyebrow.he.length).toBeGreaterThan(0);
    expect(p.heading.en.length).toBeGreaterThan(0);
    expect(p.heading.he.length).toBeGreaterThan(0);
    expect(p.continueLabel.en.length).toBeGreaterThan(0);
    expect(p.continueLabel.he.length).toBeGreaterThan(0);
  });

  it("has at least four body paragraphs (the Hirschman source has five)", () => {
    const p = getPsychoEducation();
    expect(p.body.length).toBeGreaterThanOrEqual(4);
    for (const para of p.body) {
      expect(para.en.length).toBeGreaterThan(0);
      expect(para.he.length).toBeGreaterThan(0);
    }
  });
});

// B-03 v1: the calming protocol is a 5-step user-initiated regulation flow.
// Order and shape are load-bearing — wrong step order or missing prompts
// would break the orchestrator that drives the screen.
describe("content / calming protocol", () => {
  it("returns exactly five steps in the documented order", () => {
    const steps = getCalmingProtocol();
    expect(steps.map((s) => s.kind)).toEqual([
      "validation",
      "body-grounding",
      "box-breathing",
      "sensory-grounding",
      "close",
    ]);
  });

  it("box-breathing has 2 cycles × 4 phases at 4s each — matches Hirschman doc", () => {
    const steps = getCalmingProtocol();
    const boxBreathing = steps.find((s) => s.kind === "box-breathing");
    if (boxBreathing?.kind !== "box-breathing") {
      throw new Error("box-breathing step missing");
    }
    expect(boxBreathing.cycles).toBe(2);
    expect(boxBreathing.phaseMs).toBe(4_000);
    expect(boxBreathing.prompts.inhale.en.length).toBeGreaterThan(0);
    expect(boxBreathing.prompts.inhale.he.length).toBeGreaterThan(0);
    expect(boxBreathing.prompts.hold.en.length).toBeGreaterThan(0);
    expect(boxBreathing.prompts.exhale.en.length).toBeGreaterThan(0);
  });

  it("sensory-grounding has three sub-steps in 3 → 2 → 1 order", () => {
    const steps = getCalmingProtocol();
    const sensory = steps.find((s) => s.kind === "sensory-grounding");
    if (sensory?.kind !== "sensory-grounding") {
      throw new Error("sensory-grounding step missing");
    }
    expect(sensory.steps.map((s) => s.count)).toEqual([3, 2, 1]);
    for (const sub of sensory.steps) {
      expect(sub.prompt.en.length).toBeGreaterThan(0);
      expect(sub.prompt.he.length).toBeGreaterThan(0);
      expect(sub.durationMs).toBeGreaterThan(0);
    }
  });

  it("prose steps (validation/body/close) have content in both languages", () => {
    const steps = getCalmingProtocol();
    for (const s of steps) {
      if (s.kind === "validation" || s.kind === "body-grounding" || s.kind === "close") {
        expect(s.text.en.length).toBeGreaterThan(0);
        expect(s.text.he.length).toBeGreaterThan(0);
        expect(s.durationMs).toBeGreaterThan(0);
      }
    }
  });
});
