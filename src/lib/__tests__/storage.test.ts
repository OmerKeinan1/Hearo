jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDisplayName, setDisplayName } from "@/lib/storage";

// Tri-state semantics under test: `undefined` (never tried) vs `null` (tried,
// nothing usable) vs a string name. Collapsing the first two is the bug to catch.
describe("storage / display name", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns undefined when a name was never resolved", async () => {
    expect(await getDisplayName()).toBeUndefined();
  });

  it("round-trips a string name and marks it resolved", async () => {
    await setDisplayName("Omer");
    expect(await getDisplayName()).toBe("Omer");
  });

  it("round-trips a null result (tried, found nothing usable)", async () => {
    await setDisplayName(null);
    expect(await getDisplayName()).toBeNull();
  });

  it("setDisplayName(null) removes a previously stored name but stays resolved", async () => {
    await setDisplayName("Omer");
    await setDisplayName(null);
    expect(await AsyncStorage.getItem("hearo:displayName")).toBeNull();
    expect(await getDisplayName()).toBeNull();
  });
});
