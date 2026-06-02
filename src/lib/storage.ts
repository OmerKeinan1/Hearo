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
