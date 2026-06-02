import { pickRandomTrigger } from "@/lib/audio";
import * as content from "@/lib/content";

// Distinct numeric variations so we can assert on index selection precisely
// (the asset mock collapses all real requires to a single value).
function stubVariations(variations: number[]) {
  jest.spyOn(content, "getSound").mockReturnValue({
    key: "siren",
    label: { en: "", he: "" },
    audioVariations: variations,
  } as unknown as content.Sound);
}

describe("audio / pickRandomTrigger", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns null with no sound key (rehearsal walk, no exposure)", () => {
    expect(pickRandomTrigger(undefined)).toBeNull();
  });

  it("returns null when the sound has no variations", () => {
    stubVariations([]);
    expect(pickRandomTrigger("siren")).toBeNull();
  });

  it("returns a member of the sound's variations", () => {
    stubVariations([10, 20, 30]);
    jest.spyOn(Math, "random").mockReturnValue(0.99);
    expect(pickRandomTrigger("siren")).toBe(30);
  });

  it("uses Math.random to index the chosen variation", () => {
    stubVariations([10, 20, 30]);
    jest.spyOn(Math, "random").mockReturnValue(0); // floor(0 * 3) = 0
    expect(pickRandomTrigger("siren")).toBe(10);
  });
});
