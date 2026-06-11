import { render, screen, fireEvent } from "@testing-library/react-native";

import { CrisisAffordance } from "../CrisisAffordance";
import { useCrisisStore } from "@/lib/storage/crisis-store";

// Tier 1 — safety-critical. This little "i" is the one-tap path a veteran in
// crisis uses to reach the support sheet. The contract that matters: pressing it
// drives the store to isOpen=true, it stays renderable on both background tones,
// and it stays reachable to assistive tech (button role + a clear label).
describe("CrisisAffordance", () => {
  it("pressing the affordance opens the crisis sheet", () => {
    // Setup resets the store after each test, so it starts closed.
    expect(useCrisisStore.getState().isOpen).toBe(false);

    render(<CrisisAffordance />);
    fireEvent.press(screen.getByRole("button"));

    expect(useCrisisStore.getState().isOpen).toBe(true);
  });

  it("renders the default on-bg tone without throwing", () => {
    expect(() => render(<CrisisAffordance />)).not.toThrow();
    expect(screen.getByText("i")).toBeTruthy();
  });

  it("renders the on-scene tone without throwing", () => {
    expect(() => render(<CrisisAffordance tone="on-scene" />)).not.toThrow();
    expect(screen.getByText("i")).toBeTruthy();
  });

  it("exposes a labelled button to assistive tech", () => {
    render(<CrisisAffordance />);
    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
    expect(screen.getByLabelText("open crisis support")).toBeTruthy();
  });
});
