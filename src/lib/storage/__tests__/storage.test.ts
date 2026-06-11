jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDisplayName,
  setDisplayName,
  getReminderSchedule,
  setReminderSchedule,
  getTrustedContactIds,
  setTrustedContactIds,
  getHealthKitGranted,
  setHealthKitGranted,
  getPsychoEducationSeen,
  setPsychoEducationSeen,
  getClinicalScreeningResult,
  setClinicalScreeningResult,
} from "@/lib/storage/storage";

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

describe("storage / reminder schedule", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns null when no schedule is set", async () => {
    expect(await getReminderSchedule()).toBeNull();
  });

  it("round-trips a schedule", async () => {
    await setReminderSchedule({ hour: 9, minute: 30 });
    expect(await getReminderSchedule()).toEqual({ hour: 9, minute: 30 });
  });

  it("setReminderSchedule(null) clears the stored schedule", async () => {
    await setReminderSchedule({ hour: 9, minute: 30 });
    await setReminderSchedule(null);
    expect(await getReminderSchedule()).toBeNull();
  });

  it("returns null when the stored value is invalid JSON", async () => {
    await AsyncStorage.setItem("hearo:reminderSchedule", "not-json");
    expect(await getReminderSchedule()).toBeNull();
  });

  it("returns null when the parsed object has the wrong shape", async () => {
    await AsyncStorage.setItem(
      "hearo:reminderSchedule",
      JSON.stringify({ hour: "nine" }),
    );
    expect(await getReminderSchedule()).toBeNull();
  });
});

describe("storage / trusted contact ids", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns an empty array when nothing is stored", async () => {
    expect(await getTrustedContactIds()).toEqual([]);
  });

  it("round-trips an ordered list of ids", async () => {
    await setTrustedContactIds(["a", "b", "c"]);
    expect(await getTrustedContactIds()).toEqual(["a", "b", "c"]);
  });

  it("filters non-string entries defensively", async () => {
    await AsyncStorage.setItem(
      "hearo:trustedContactIds",
      JSON.stringify(["a", 42, null, "b"]),
    );
    expect(await getTrustedContactIds()).toEqual(["a", "b"]);
  });

  it("returns an empty array on corrupt JSON", async () => {
    await AsyncStorage.setItem("hearo:trustedContactIds", "{not json");
    expect(await getTrustedContactIds()).toEqual([]);
  });

  it("returns an empty array when the stored value isn't an array", async () => {
    await AsyncStorage.setItem(
      "hearo:trustedContactIds",
      JSON.stringify({ not: "an array" }),
    );
    expect(await getTrustedContactIds()).toEqual([]);
  });
});

describe("storage / healthkit granted flag", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("defaults to false", async () => {
    expect(await getHealthKitGranted()).toBe(false);
  });

  it("setHealthKitGranted(true) persists the flag", async () => {
    await setHealthKitGranted(true);
    expect(await getHealthKitGranted()).toBe(true);
  });

  it("setHealthKitGranted(false) removes the flag", async () => {
    await setHealthKitGranted(true);
    await setHealthKitGranted(false);
    expect(await getHealthKitGranted()).toBe(false);
    expect(await AsyncStorage.getItem("hearo:healthKitGranted")).toBeNull();
  });
});

// B-02: gates the first-session psycho-education screen. Boolean — no
// tri-state. The Setup re-read link does NOT reset this.
describe("storage / psycho-education seen flag", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("defaults to false (never seen)", async () => {
    expect(await getPsychoEducationSeen()).toBe(false);
  });

  it("setPsychoEducationSeen(true) persists the flag", async () => {
    await setPsychoEducationSeen(true);
    expect(await getPsychoEducationSeen()).toBe(true);
  });

  it("setPsychoEducationSeen(false) clears the flag", async () => {
    await setPsychoEducationSeen(true);
    await setPsychoEducationSeen(false);
    expect(await getPsychoEducationSeen()).toBe(false);
    expect(await AsyncStorage.getItem("hearo:psychoEducationSeen")).toBeNull();
  });
});

// B-01 scaffold: tri-state semantics matter. `undefined` (never asked) vs
// `null` (explicitly declined) vs a Result record. No code path writes a
// non-null record today.
describe("storage / clinical screening result", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("returns undefined when never asked", async () => {
    expect(await getClinicalScreeningResult()).toBeUndefined();
  });

  it("setClinicalScreeningResult(null) persists the declined state", async () => {
    await setClinicalScreeningResult(null);
    expect(await getClinicalScreeningResult()).toBeNull();
  });

  it("round-trips a full result record", async () => {
    const record = {
      band: "moderate" as const,
      score: 42,
      takenAt: 1_700_000_000_000,
      version: "pcl5-v1",
    };
    await setClinicalScreeningResult(record);
    expect(await getClinicalScreeningResult()).toEqual(record);
  });

  it("returns undefined when the persisted shape is malformed", async () => {
    await AsyncStorage.setItem("hearo:clinicalScreeningResult", JSON.stringify({ band: "🤷" }));
    expect(await getClinicalScreeningResult()).toBeUndefined();
  });

  it("returns undefined when the stored value isn't JSON", async () => {
    await AsyncStorage.setItem("hearo:clinicalScreeningResult", "not-json-not-declined");
    expect(await getClinicalScreeningResult()).toBeUndefined();
  });
});
