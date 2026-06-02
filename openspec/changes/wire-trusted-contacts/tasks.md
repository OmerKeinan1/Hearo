## 1. Dependency + permissions

- [ ] 1.1 `npx expo install expo-contacts`
- [ ] 1.2 Add `NSContactsUsageDescription` to `app.json` (ios.infoPlist). Copy: "We use this so you can quickly call someone you trust during a crisis moment. Your contacts stay on your device — we don't upload them."

## 2. Storage + adapter

- [ ] 2.1 Add `trustedContactIds` key to `src/lib/storage.ts`
- [ ] 2.2 Create `src/lib/trustedContacts.ts` exposing:
  - `getTrustedContactIds()` → string[]
  - `addTrustedContact(id)` / `removeTrustedContact(id)` with the 5-cap enforced
  - `resolveContact(id)` → `{ name, phone } | null` via `expo-contacts.getContactByIdAsync` (returns null gracefully if permission revoked)

## 3. Crisis sheet UI

- [ ] 3.1 Update `src/components/CrisisSheet.tsx` to read trusted contacts via the new adapter
- [ ] 3.2 Empty state: render "Add someone" tappable that triggers the contacts permission flow then a picker
- [ ] 3.3 Populated state: render the configured contacts as tappable rows, most-recently-added first; tap → `Linking.openURL(\`tel:${phone}\`)`
- [ ] 3.4 Cap-reached state: show quiet "list is full, remove someone first" message in the add flow
- [ ] 3.5 Permission-denied state: hide the *a person you trust* row, show a single line about ERAN

## 4. i18n

- [ ] 4.1 New keys under `crisis.trustedContacts.*`: `addSomeone`, `listFull`, `denyExplanation` — EN + HE
- [ ] 4.2 Drop the old `crisis.trustedStub` (no longer used)

## 5. Verification

- [ ] 5.1 `npx tsc --noEmit` clean
- [ ] 5.2 `npx expo export --platform web` bundles
- [ ] 5.3 Manual on a device with real contacts: add 2-3 contacts, verify tap → dialer prefilled, verify cap at 5
- [ ] 5.4 Manual: deny permission, verify the sheet falls back gracefully and does NOT re-prompt
- [ ] 5.5 `npx -y @fission-ai/openspec validate wire-trusted-contacts` passes
