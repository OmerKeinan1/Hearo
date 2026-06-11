// Typed key/value persistence on-device.
//
// Same seam pattern as lib/content.ts but for *user data* rather than *content*.
// Today this wraps AsyncStorage; nothing here leaves the device. If we ever
// add cloud sync, only this file's bodies change — call sites stay the same.

import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "hearo:";

const KEYS = {
  displayName: `${PREFIX}displayName`,
  displayNameResolved: `${PREFIX}displayNameResolved`,
  reminderSchedule: `${PREFIX}reminderSchedule`,
  trustedContactIds: `${PREFIX}trustedContactIds`,
  healthKitGranted: `${PREFIX}healthKitGranted`,
  psychoEducationSeen: `${PREFIX}psychoEducationSeen`,
  clinicalScreeningResult: `${PREFIX}clinicalScreeningResult`,
} as const;

/** A name we've resolved (or explicitly determined we can't resolve) for the
 *  current device. `null` means we tried and got nothing usable — distinct
 *  from "never tried", which is the case before the first call. */
type StoredDisplayName = string | null;

export async function getDisplayName(): Promise<StoredDisplayName | undefined> {
  const resolved = await AsyncStorage.getItem(KEYS.displayNameResolved);
  if (resolved !== "true") return undefined; // never tried
  const value = await AsyncStorage.getItem(KEYS.displayName);
  return value; // either a string or null (we tried and got nothing)
}

export async function setDisplayName(name: StoredDisplayName): Promise<void> {
  if (name === null) {
    await AsyncStorage.removeItem(KEYS.displayName);
  } else {
    await AsyncStorage.setItem(KEYS.displayName, name);
  }
  await AsyncStorage.setItem(KEYS.displayNameResolved, "true");
}

/** Daily reminder schedule. `null` means reminders are off. */
export type ReminderSchedule = { hour: number; minute: number };

export async function getReminderSchedule(): Promise<ReminderSchedule | null> {
  const raw = await AsyncStorage.getItem(KEYS.reminderSchedule);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ReminderSchedule;
    if (typeof parsed.hour !== "number" || typeof parsed.minute !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setReminderSchedule(schedule: ReminderSchedule | null): Promise<void> {
  if (schedule === null) {
    await AsyncStorage.removeItem(KEYS.reminderSchedule);
  } else {
    await AsyncStorage.setItem(KEYS.reminderSchedule, JSON.stringify(schedule));
  }
}

/** Stable contact IDs the user has nominated as trusted. Order is preserved
 *  (most-recently-added first, per the crisis-access spec). Capped externally
 *  in lib/trustedContacts.ts. */
export async function getTrustedContactIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.trustedContactIds);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export async function setTrustedContactIds(ids: string[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.trustedContactIds, JSON.stringify(ids));
}

/** Sticky flag set the first time HealthKit authorization succeeds. iOS's
 *  HealthKit read-permission API intentionally hides the user's choice, so
 *  on cold start we can't query the OS to learn we were previously granted
 *  — we persist the fact ourselves to avoid re-prompting on every launch.
 *  If the user revokes in Settings later, data reads just silently return
 *  nothing and the pulse hook falls through to the mock generator. */
export async function getHealthKitGranted(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.healthKitGranted);
  return raw === "true";
}

export async function setHealthKitGranted(granted: boolean): Promise<void> {
  if (granted) {
    await AsyncStorage.setItem(KEYS.healthKitGranted, "true");
  } else {
    await AsyncStorage.removeItem(KEYS.healthKitGranted);
  }
}

/** Whether the user has seen the first-session psycho-education screen.
 *  Boolean — defaults to `false` (never seen). Two-state, no tri-state needed:
 *  the screen has no meaningful "tried-and-skipped" case. The Setup screen's
 *  re-read link does not reset this to `false`. */
export async function getPsychoEducationSeen(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEYS.psychoEducationSeen);
  return raw === "true";
}

export async function setPsychoEducationSeen(seen: boolean): Promise<void> {
  if (seen) {
    await AsyncStorage.setItem(KEYS.psychoEducationSeen, "true");
  } else {
    await AsyncStorage.removeItem(KEYS.psychoEducationSeen);
  }
}

/** Clinical screening result. Tri-state on purpose:
 *  - `undefined`: never asked (default first-launch state).
 *  - `null`: explicitly declined / "prefer not to say".
 *  - Record: a completed screening with severity band + raw score + timestamp.
 *  Scaffold-only today (B-01) — no code path writes a non-null record yet.
 *  See `openspec/changes/add-clinical-screening/`. */
export type ClinicalScreeningResult = {
  band: "mild" | "moderate" | "severe";
  score: number;
  takenAt: number;
  version: string;
};

export async function getClinicalScreeningResult(): Promise<ClinicalScreeningResult | null | undefined> {
  const raw = await AsyncStorage.getItem(KEYS.clinicalScreeningResult);
  if (raw === null) return undefined;
  if (raw === "declined") return null;
  try {
    const parsed = JSON.parse(raw) as ClinicalScreeningResult;
    if (
      (parsed.band === "mild" || parsed.band === "moderate" || parsed.band === "severe") &&
      typeof parsed.score === "number" &&
      typeof parsed.takenAt === "number" &&
      typeof parsed.version === "string"
    ) {
      return parsed;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function setClinicalScreeningResult(
  result: ClinicalScreeningResult | null,
): Promise<void> {
  if (result === null) {
    await AsyncStorage.setItem(KEYS.clinicalScreeningResult, "declined");
  } else {
    await AsyncStorage.setItem(KEYS.clinicalScreeningResult, JSON.stringify(result));
  }
}
