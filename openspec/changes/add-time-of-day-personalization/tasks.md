## 1. Time-of-day helper

- [ ] 1.1 Create `src/lib/timeOfDay.ts` exporting `getTimeOfDay(): "morning" | "afternoon" | "evening" | "night"` and `getDefaultSceneForTimeOfDay(): SceneKey`
- [ ] 1.2 Add unit-style tests covering the four bands + boundary minutes (04:59, 05:00, 11:59, 12:00, 17:59, 18:00, 22:59, 23:00)

## 2. i18n

- [ ] 2.1 Replace `home.greeting` / `home.greetingNoName` with four-band keys: `home.greeting.morning`, `home.greeting.afternoon`, `home.greeting.evening`, `home.greeting.night` (and matching `*NoName` siblings) — EN + HE
- [ ] 2.2 Update Home screen render to look up the band via `getTimeOfDay()` and select the matching i18n key

## 3. Default scene

- [ ] 3.1 In `lib/content.ts`, change `getDefaultPreferences()` to derive `scene` from `getDefaultSceneForTimeOfDay()`
- [ ] 3.2 Verify session-store still respects user-set scene over the default (existing behavior — should not regress)

## 4. Verification

- [ ] 4.1 `npx tsc --noEmit` clean
- [ ] 4.2 `npx expo export --platform web` bundles
- [ ] 4.3 Manual: change device clock to each band, confirm greeting + default scene match
- [ ] 4.4 `npx -y @fission-ai/openspec validate add-time-of-day-personalization` passes
