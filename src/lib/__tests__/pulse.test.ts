import { renderHook, act } from "@testing-library/react-native";
import { usePulse } from "@/lib/pulse";

describe("usePulse", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // (0.5 - 0.5) * JITTER = 0 → deterministic, jitter-free movement.
    jest.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    // Discard (don't fire) any interval left pending — firing it would trigger
    // a setState after the hook has been torn down, outside act().
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("starts at the baseline target", () => {
    const { result } = renderHook(() =>
      usePulse({ active: true, phase: "baseline" }),
    );
    expect(result.current.value).toBe(74);
    expect(result.current.source).toBe("mock");
  });

  it("does not change while inactive", () => {
    const { result } = renderHook(() =>
      usePulse({ active: false, phase: "peak" }),
    );
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.value).toBe(74);
  });

  it("rises toward the peak target over time when active", () => {
    const { result } = renderHook(() =>
      usePulse({ active: true, phase: "peak" }),
    );
    act(() => {
      jest.advanceTimersByTime(2200); // ~10 ticks @ 220ms
    });
    expect(result.current.value).toBeGreaterThan(74);
    expect(result.current.value).toBeLessThanOrEqual(112);
  });

  it("clamps the value within [58, 130]", () => {
    const { result } = renderHook(() =>
      usePulse({ active: true, phase: "peak" }),
    );
    act(() => {
      jest.advanceTimersByTime(60000);
    });
    expect(result.current.value).toBeGreaterThanOrEqual(58);
    expect(result.current.value).toBeLessThanOrEqual(130);
  });

  it("clears its interval on unmount", () => {
    const clearSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = renderHook(() =>
      usePulse({ active: true, phase: "rising" }),
    );
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
