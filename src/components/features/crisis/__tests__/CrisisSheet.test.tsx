import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

// expo-contacts is an ES-class native module that doesn't transpile under
// jest-expo. Use the shared manual mock so the Tier-1 tests get a stub and the
// picker-flow tests can drive granted permission + candidate lists per-test.
jest.mock("expo-contacts", () =>
  require("../../../../../test/mocks/expo-contacts"),
);

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as contactsMock from "../../../../../test/mocks/expo-contacts";
import { CrisisSheet } from "../CrisisSheet";
import { CRISIS_NUMBER, useCrisisStore } from "@/lib/storage/crisis-store";

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
  beforeEach(async () => {
    await AsyncStorage.clear();
    contactsMock.__reset(); // defaults: permission granted, empty contact list
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

  // ── Trusted-contact picker flow ──────────────────────────────────────────

  it("opens the picker, lists candidates, and adds one to the trusted list", async () => {
    contactsMock.getPermissionsAsync.mockResolvedValue({ status: "granted" });
    contactsMock.getContactsAsync.mockResolvedValue({
      data: [{ id: "c1", name: "Dana", phoneNumbers: [{ label: "mobile", number: "0501112222" }] }],
    });
    // resolveTrustedContacts() re-reads the picked contact from the OS after add.
    contactsMock.getContactByIdAsync.mockResolvedValue({
      name: "Dana",
      phoneNumbers: [{ label: "mobile", number: "0501112222" }],
    });

    await renderOpenSheet();
    fireEvent.press(screen.getByText("Add someone  +"));

    // Picker view shows the candidate with its phone number.
    await waitFor(() => expect(screen.getByText("0501112222")).toBeTruthy());
    fireEvent.press(screen.getByText("Dana"));

    // Back on the main view: Dana is now trusted (name only — the phone-bearing
    // picker row is gone).
    await waitFor(() => expect(screen.queryByText("0501112222")).toBeNull());
    expect(screen.getByText("Dana")).toBeTruthy();
  });

  it("requests contacts permission before opening the picker when undetermined", async () => {
    contactsMock.getPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    contactsMock.requestPermissionsAsync.mockResolvedValue({ status: "granted" });
    contactsMock.getContactsAsync.mockResolvedValue({
      data: [{ id: "c2", name: "Eli", phoneNumbers: [{ number: "0539998888" }] }],
    });

    await renderOpenSheet();
    fireEvent.press(screen.getByText("Add someone  +"));

    expect(contactsMock.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText("0539998888")).toBeTruthy());
  });

  it("shows no trusted section or add button when permission is denied", async () => {
    contactsMock.getPermissionsAsync.mockResolvedValue({ status: "denied" });

    render(<CrisisSheet />);
    // The hotline is always reachable...
    await waitFor(() => expect(screen.getByText(/Call ERAN/)).toBeTruthy());
    // ...but with contacts denied, the picker affordance is hidden.
    expect(screen.queryByText("Add someone  +")).toBeNull();
  });
});
