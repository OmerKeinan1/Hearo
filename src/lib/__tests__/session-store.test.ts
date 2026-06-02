import { useSessionStore } from "@/lib/session-store";
import { getDefaultPreferences } from "@/lib/content";

describe("session-store", () => {
  const defaults = getDefaultPreferences();

  beforeEach(() => {
    useSessionStore.setState({ scene: defaults.scene, sounds: defaults.sounds });
  });

  it("initializes from default preferences", () => {
    const s = useSessionStore.getState();
    expect(s.scene).toBe(defaults.scene);
    expect(s.sounds).toEqual(defaults.sounds);
  });

  it("setScene replaces the selected scene", () => {
    useSessionStore.getState().setScene("beach");
    expect(useSessionStore.getState().scene).toBe("beach");
  });

  it("toggleSound adds a sound when it is absent", () => {
    useSessionStore.setState({ sounds: [] });
    useSessionStore.getState().toggleSound("siren");
    expect(useSessionStore.getState().sounds).toContain("siren");
  });

  it("toggleSound removes a sound when it is already present", () => {
    useSessionStore.setState({ sounds: ["siren"] });
    useSessionStore.getState().toggleSound("siren");
    expect(useSessionStore.getState().sounds).not.toContain("siren");
  });

  it("toggleSound leaves other selected sounds untouched", () => {
    useSessionStore.setState({ sounds: ["siren", "motorcycle"] });
    useSessionStore.getState().toggleSound("siren");
    expect(useSessionStore.getState().sounds).toEqual(["motorcycle"]);
  });
});
