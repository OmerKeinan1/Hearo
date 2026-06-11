// Trusted contacts — the crisis sheet's secondary action.
//
// The user nominates up to MAX_CONTACTS from their device address book.
// We store only their stable contact IDs (not names/numbers), and re-read
// the contact data from the OS at render time so updates in the user's
// phone book are reflected without sync logic.
//
// No backend. No telemetry on which contact gets called or when.

import * as Contacts from "expo-contacts";

import { getTrustedContactIds, setTrustedContactIds } from "@/lib/storage/storage";

export const MAX_CONTACTS = 5;

export type ResolvedContact = {
  id: string;
  name: string;
  phone: string;
};

export type PermissionState = "granted" | "denied" | "undetermined";

export async function getPermissionState(): Promise<PermissionState> {
  const { status } = await Contacts.getPermissionsAsync();
  return status;
}

export async function requestPermission(): Promise<PermissionState> {
  const { status } = await Contacts.requestPermissionsAsync();
  return status;
}

export { getTrustedContactIds };

export async function addTrustedContact(id: string): Promise<{ ok: boolean; reason?: "full" | "duplicate" }> {
  const ids = await getTrustedContactIds();
  if (ids.includes(id)) return { ok: false, reason: "duplicate" };
  if (ids.length >= MAX_CONTACTS) return { ok: false, reason: "full" };
  // Most-recently-added first.
  await setTrustedContactIds([id, ...ids]);
  return { ok: true };
}

export async function removeTrustedContact(id: string): Promise<void> {
  const ids = await getTrustedContactIds();
  await setTrustedContactIds(ids.filter((x) => x !== id));
}

function firstPhone(c: Contacts.ExistingContact): string | null {
  const phones = c.phoneNumbers;
  if (!phones || phones.length === 0) return null;
  // Prefer mobile, fall back to first.
  const mobile = phones.find((p: Contacts.PhoneNumber) => /mobile/i.test(p.label ?? ""));
  const picked = (mobile ?? phones[0]).number ?? null;
  return picked ? picked.replace(/\s+/g, "") : null;
}

/** Look up the OS contact record for a stored ID. Returns null if the OS
 *  can't find it (deleted contact, revoked permission, etc.). */
export async function resolveContact(id: string): Promise<ResolvedContact | null> {
  try {
    const result = await Contacts.getContactByIdAsync(id, [
      Contacts.Fields.Name,
      Contacts.Fields.PhoneNumbers,
    ]);
    if (!result) return null;
    const phone = firstPhone(result);
    if (!phone) return null;
    return {
      id,
      name: result.name ?? phone,
      phone,
    };
  } catch {
    return null;
  }
}

/** Resolve all configured contacts at once, skipping any that don't resolve. */
export async function resolveTrustedContacts(): Promise<ResolvedContact[]> {
  const ids = await getTrustedContactIds();
  const resolved = await Promise.all(ids.map(resolveContact));
  return resolved.filter((c): c is ResolvedContact => c !== null);
}

/** All device contacts with at least one phone number, name-sorted. Used by
 *  the in-sheet picker. Failures (permission revoked between checks, OS
 *  errors, etc.) are swallowed and surface as an empty list — never as an
 *  unhandled throw inside a crisis-flow click handler. */
export async function listAllContacts(): Promise<ResolvedContact[]> {
  try {
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      sort: Contacts.SortTypes.FirstName,
    });
    return data
      .map((c) => {
        const phone = firstPhone(c);
        if (!phone || !c.id || !c.name) return null;
        return { id: c.id, name: c.name, phone };
      })
      .filter((c): c is ResolvedContact => c !== null);
  } catch {
    return [];
  }
}
