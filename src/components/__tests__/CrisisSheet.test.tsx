import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

// expo-contacts uses an ES class that doesn't transpile cleanly in jest-expo
// (the native module's superclass is undefined at test time → "Super expression
// must either be null or a function"). The CrisisSheet only needs the contact
// helpers to *exist* — none of these Tier-1 assertions exercise the picker —
// so mock the module surface that lib/trustedContacts.ts imports.
jest.mock("expo-contacts", () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: "undetermined" }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: "denied" }),
  getContactByIdAsync: jest.fn().mockResolvedValue(undefined),
  getContactsAsync: jest.fn().mockResolvedValue({ data: [] }),
  Fields: { Name: "Name", PhoneNumbers: "PhoneNumbers" },
  SortTypes: { FirstName: "FirstName" },
}));

import { CrisisSheet } from "../CrisisSheet";
import { CRISIS_NUMBER, useCrisisStore } from "@/lib/crisis-store";

async function renderOpenSheet() {
  render(<CrisisSheet />);
  await waitFor(() => {
    expect(screen.getByText("Add someone  +")).toBeTruthy();
  });
}

// Tier 1 — safety-critical. This is the path a veteran in crisis walks: open the
// sheet, tap the hotline, reach ERAN. A wrong number, a dead button, or a state
// leak here is a real-world harm, so every branch gets a focused assert. The
// tel: target is built from CRISIS_NUMBER on purpose — it stays a tripwire that
// fails loudly if the hard-coded region number ever drifts.
describe("CrisisSheet", () => {
  beforeEach(() => {
    useCrisisStore.setState({ isOpen: true });
  });

  it("dials EXACTLY tel:1201 when the call line is pressed", async () => {
    const openURL = jest
      .spyOn(require("react-native").Linking, "openURL")
      .mockResolvedValue(undefined);

    await renderOpenSheet();

    // "Call ERAN" + "1201" render as sibling text segments in one Text node;
    // match the composite content with a regex so the split children resolve.
    fireEvent.press(screen.getByText(/Call ERAN/));

    expect(openURL).toHaveBeenCalledTimes(1);
    expect(openURL).toHaveBeenCalledWith(`tel:${CRISIS_NUMBER}`);
    // Belt-and-suspenders tripwire: the literal target, spelled out.
    expect(openURL).toHaveBeenCalledWith("tel:1201");

    openURL.mockRestore();
  });

  it("closes when the Close action is pressed", async () => {
    await renderOpenSheet();

    fireEvent.press(screen.getByText("Close"));

    expect(useCrisisStore.getState().isOpen).toBe(false);
  });

  it("closes when the backdrop 'close crisis support' pressable is pressed", async () => {
    await renderOpenSheet();

    fireEvent.press(screen.getByLabelText("close crisis support"));

    expect(useCrisisStore.getState().isOpen).toBe(false);
  });

  it("renders the title and 'free' copy while open", async () => {
    await renderOpenSheet();

    expect(
      screen.getByText("Need someone\nto talk to\nright now?"),
    ).toBeTruthy();
    expect(screen.getByText("Free, 24/7,\nanonymous.")).toBeTruthy();
  });
});
