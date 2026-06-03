import { render, screen } from "@testing-library/react-native";

import { IntensitySlider } from "../IntensitySlider";

// Tier 2 — the intensity ceiling is how a veteran tells the app "this is as loud
// as I can take right now." We assert the static affordances (the Softer/Louder
// anchors) and the effective-shadow indicator, which is the only honest signal
// that the engine is voluntarily playing below the user's ceiling. The pan
// gesture that drives onChange is reanimated/gesture-handler worklet territory
// and is documented as gesture-driven/uncovered below.
describe("IntensitySlider", () => {
  it("renders the Softer and Louder anchor labels", () => {
    render(<IntensitySlider value={0.5} onChange={() => {}} />);
    expect(screen.getByText("Softer")).toBeTruthy();
    expect(screen.getByText("Louder")).toBeTruthy();
  });

  it("shows the effective-shadow indicator when effective is meaningfully below value", () => {
    // effective (0.2) < value (0.9) - 0.02 -> indicator renders.
    render(<IntensitySlider value={0.9} effective={0.2} onChange={() => {}} />);
    const shadows = screen.UNSAFE_getAllByType(
      require("react-native").View,
    ).filter((node: { props: { style?: { borderColor?: string } } }) => {
      const style = node.props.style;
      return (
        style != null &&
        !Array.isArray(style) &&
        typeof style.borderColor === "string"
      );
    });
    // The bordered, low-opacity circle is the shadow indicator.
    expect(shadows.length).toBeGreaterThan(0);
  });

  it("hides the effective-shadow indicator when effective is omitted", () => {
    render(<IntensitySlider value={0.9} onChange={() => {}} />);
    const shadows = screen.UNSAFE_getAllByType(
      require("react-native").View,
    ).filter((node: { props: { style?: { borderColor?: string } } }) => {
      const style = node.props.style;
      return (
        style != null &&
        !Array.isArray(style) &&
        typeof style.borderColor === "string"
      );
    });
    expect(shadows.length).toBe(0);
  });

  it("hides the indicator when effective is within the 0.02 deadband of value", () => {
    // effective (0.89) is NOT < value (0.9) - 0.02 -> stays hidden.
    render(<IntensitySlider value={0.9} effective={0.89} onChange={() => {}} />);
    const shadows = screen.UNSAFE_getAllByType(
      require("react-native").View,
    ).filter((node: { props: { style?: { borderColor?: string } } }) => {
      const style = node.props.style;
      return (
        style != null &&
        !Array.isArray(style) &&
        typeof style.borderColor === "string"
      );
    });
    expect(shadows.length).toBe(0);
  });
});
