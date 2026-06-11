import { render, screen } from "@testing-library/react-native";

import { PulseTicker } from "../PulseTicker";

// Tier 3 — smoke. PulseTicker is the in-session heart-rate readout. If it
// stops rendering the label or the live value, the veteran loses the one bit
// of biometric feedback the session UI gives them. These asserts just prove
// the component mounts and shows both halves: the "Pulse" label and the number.
describe("PulseTicker", () => {
  it('renders the EN "Pulse" label', () => {
    render(<PulseTicker value={72} />);
    expect(screen.getByText("Pulse")).toBeTruthy();
  });

  it("renders the numeric value prop", () => {
    render(<PulseTicker value={72} />);
    expect(screen.getByText("72")).toBeTruthy();
  });
});
