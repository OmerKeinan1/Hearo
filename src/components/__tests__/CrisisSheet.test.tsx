import { render, screen, fireEvent } from "@testing-library/react-native";

import { CrisisSheet } from "../CrisisSheet";
import { CRISIS_NUMBER, useCrisisStore } from "@/lib/crisis-store";

// Tier 1 — safety-critical. This is the path a veteran in crisis walks: open the
// sheet, tap the hotline, reach ERAN. A wrong number, a dead button, or a state
// leak here is a real-world harm, so every branch gets a focused assert. The
// tel: target is built from CRISIS_NUMBER on purpose — it stays a tripwire that
// fails loudly if the hard-coded region number ever drifts.
describe("CrisisSheet", () => {
  beforeEach(() => {
    // Drive the store directly: the sheet renders off isOpen/showingTrustedStub.
    useCrisisStore.setState({ isOpen: true, showingTrustedStub: false });
  });

  it("dials EXACTLY tel:1201 when the call line is pressed", () => {
    const openURL = jest
      .spyOn(require("react-native").Linking, "openURL")
      .mockResolvedValue(undefined);

    render(<CrisisSheet />);

    // "Call ERAN" + "1201" render as sibling text segments in one Text node;
    // match the composite content with a regex so the split children resolve.
    fireEvent.press(screen.getByText(/Call ERAN/));

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(`tel:${CRISIS_NUMBER}`);
    // Belt-and-suspenders tripwire: the literal target, spelled out.
    expect(openURL).toHaveBeenCalledWith("tel:1201");

    openURL.mockRestore();
  });

  it("shows the trusted-contacts stub when 'A person you trust' is pressed", () => {
    const showTrustedStub = jest.spyOn(
      useCrisisStore.getState(),
      "showTrustedStub",
    );

    render(<CrisisSheet />);

    fireEvent.press(screen.getByText("A person you trust"));

    expect(showTrustedStub).toHaveBeenCalledTimes(1);
    expect(useCrisisStore.getState().showingTrustedStub).toBe(true);
    // The stub copy (with its newline) now renders.
    expect(
      screen.getByText("You'll be able to add\ntrusted contacts soon."),
    ).toBeTruthy();

    showTrustedStub.mockRestore();
  });

  it("hides the call line once the trusted stub is showing", () => {
    useCrisisStore.setState({ isOpen: true, showingTrustedStub: true });

    render(<CrisisSheet />);

    expect(screen.queryByText(/Call ERAN/)).toBeNull();
    expect(
      screen.getByText("You'll be able to add\ntrusted contacts soon."),
    ).toBeTruthy();
  });

  it("resets the store when the Close action is pressed", () => {
    useCrisisStore.setState({ isOpen: true, showingTrustedStub: true });

    render(<CrisisSheet />);

    fireEvent.press(screen.getByText("Close"));

    expect(useCrisisStore.getState().isOpen).toBe(false);
    expect(useCrisisStore.getState().showingTrustedStub).toBe(false);
  });

  it("closes when the backdrop 'close crisis support' pressable is pressed", () => {
    render(<CrisisSheet />);

    fireEvent.press(screen.getByLabelText("close crisis support"));

    expect(useCrisisStore.getState().isOpen).toBe(false);
    expect(useCrisisStore.getState().showingTrustedStub).toBe(false);
  });

  it("renders the title and 'free' copy while open", () => {
    render(<CrisisSheet />);

    expect(
      screen.getByText("Need someone\nto talk to\nright now?"),
    ).toBeTruthy();
    expect(screen.getByText("Free, 24/7,\nanonymous.")).toBeTruthy();
  });
});
