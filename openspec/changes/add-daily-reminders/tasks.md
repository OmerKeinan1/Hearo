## 1. Dependency + native config

- [ ] 1.1 `npx expo install expo-notifications @react-native-community/datetimepicker`
- [ ] 1.2 Add `expo-notifications` to `app.json` plugins with notification icon + color
- [ ] 1.3 Wire deep link: tapping a notification navigates via expo-router to `/home`

## 2. Storage + adapter

- [ ] 2.1 Add `reminderSchedule` key (`{ hour, minute } | null`) to `src/lib/storage.ts`
- [ ] 2.2 Create `src/lib/reminders.ts`:
  - `requestPermission()` → permission status
  - `setSchedule({ hour, minute })` — schedules + persists
  - `clearSchedule()` — cancels + clears persistence
  - `getSchedule()` — reads persisted schedule
  - `reassertSchedule()` — idempotent re-assert called at app boot

## 3. Permissions screen wiring

- [ ] 3.1 Replace the placeholder "Allow" handler with real `reminders.requestPermission()`
- [ ] 3.2 On permission grant, show the time picker; on confirm, call `setSchedule()`
- [ ] 3.3 Show "Enable in Settings →" deep link when permission is denied
- [ ] 3.4 Reflect actual permission + schedule state in the row's "granted" indicator (not just the local UI state)

## 4. Boot-time re-assert

- [ ] 4.1 In `src/app/_layout.tsx` (or a small bootstrap hook), call `reminders.reassertSchedule()` after fonts are loaded

## 5. i18n

- [ ] 5.1 New keys under `reminders.*`: `pickTime`, `notificationTitle`, `notificationBody`, `enableInSettings` — EN + HE per the spec

## 6. Verification

- [ ] 6.1 `npx tsc --noEmit` clean
- [ ] 6.2 `npx expo export --platform web` bundles
- [ ] 6.3 Manual on device: grant permission, set time 2 min in the future, confirm notification fires, confirm tap opens Home
- [ ] 6.4 Manual: deny permission, confirm Settings deep link works
- [ ] 6.5 Manual: reboot device (Android), confirm reminder still fires next day
- [ ] 6.6 `npx -y @fission-ai/openspec validate add-daily-reminders` passes
