// `mock`-prefixed so Jest allows it inside the hoisted factory. A getter keeps
// the value dynamic — displayName.ts reads Device.deviceName at call time.
let mockDeviceName: string | null = null;

jest.mock("expo-device", () => ({
  get deviceName() {
    return mockDeviceName;
  },
}));

jest.mock("@/lib/storage", () => ({
  getDisplayName: jest.fn(),
  setDisplayName: jest.fn(),
}));

import { renderHook, waitFor } from "@testing-library/react-native";

import {
  parseDisplayNameFromDevice,
  resolveDisplayName,
  useDisplayName,
} from "@/lib/displayName";
import { getDisplayName, setDisplayName } from "@/lib/storage";

const mockGet = getDisplayName as jest.Mock;
const mockSet = setDisplayName as jest.Mock;

describe("parseDisplayNameFromDevice", () => {
  it.each<[string | null, null]>([
    [null, null],
    ["", null],
    ["   ", null],
    ["iPhone", null],
    ["iPhone (2)", null],
    ["iPad", null],
    ["Android", null],
    ["My iPhone", null],
  ])("returns null for generic/empty input %p", (input, expected) => {
    expect(parseDisplayNameFromDevice(input)).toBe(expected);
  });

  it("parses an English possessive (straight apostrophe)", () => {
    expect(parseDisplayNameFromDevice("Omer's iPhone")).toBe("Omer");
  });

  it("parses an English possessive (curly apostrophe)", () => {
    expect(parseDisplayNameFromDevice("Omer’s iPhone")).toBe("Omer");
  });

  it("parses Hebrew with the device word before the name", () => {
    expect(parseDisplayNameFromDevice("אייפון של עומר")).toBe("עומר");
  });

  it("parses Hebrew with the name before the device word", () => {
    expect(parseDisplayNameFromDevice("עומר של אייפון")).toBe("עומר");
  });

  it("defaults to the side after של when both sides are ambiguous", () => {
    expect(parseDisplayNameFromDevice("דנה של עומר")).toBe("עומר");
  });

  it("returns null for an unparseable name", () => {
    expect(parseDisplayNameFromDevice("Galaxy S10")).toBeNull();
  });
});

describe("resolveDisplayName", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    mockSet.mockResolvedValue(undefined);
    mockDeviceName = null;
  });

  it("returns the cached value without consulting the device", async () => {
    mockGet.mockResolvedValue("Cached");
    expect(await resolveDisplayName()).toBe("Cached");
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("returns a cached null without re-resolving", async () => {
    mockGet.mockResolvedValue(null);
    expect(await resolveDisplayName()).toBeNull();
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("resolves from the device and caches the result on a miss", async () => {
    mockGet.mockResolvedValue(undefined);
    mockDeviceName = "Omer's iPhone";
    expect(await resolveDisplayName()).toBe("Omer");
    expect(mockSet).toHaveBeenCalledWith("Omer");
  });

  it("caches null when the device name is generic", async () => {
    mockGet.mockResolvedValue(undefined);
    mockDeviceName = "iPhone";
    expect(await resolveDisplayName()).toBeNull();
    expect(mockSet).toHaveBeenCalledWith(null);
  });
});

describe("useDisplayName", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockSet.mockReset();
    mockSet.mockResolvedValue(undefined);
    mockDeviceName = null;
  });

  it("starts loading, then settles on the resolved name", async () => {
    mockGet.mockResolvedValue("Cached");
    const { result } = renderHook(() => useDisplayName());
    expect(result.current).toEqual({ name: null, loading: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.name).toBe("Cached");
  });

  it("settles on null when no name is available", async () => {
    mockGet.mockResolvedValue(null);
    const { result } = renderHook(() => useDisplayName());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.name).toBeNull();
  });
});
