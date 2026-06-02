## 1. Dependency + native config

- [ ] 1.1 `npx expo install expo-health` (fall back to `react-native-health` if expo-health doesn't support our heart-rate read use case at the SDK version we target — verify via a small spike first)
- [ ] 1.2 Add `NSHealthShareUsageDescription` to `app.json` ios.infoPlist: "We read your heart rate from Apple Health so the app can soften the soundscape when your body needs it. Nothing about your heart rate leaves your device."
- [ ] 1.3 Add the HealthKit entitlement to the iOS config

## 2. Adapter

- [ ] 2.1 Create `src/lib/healthKit.ts`:
  - `requestAuthorization()` → permission status
  - `subscribeHeartRate(callback)` → returns unsubscribe handle, emits `{ bpm, timestamp }` samples
  - `isAvailable()` → `boolean` (watch paired + permission granted)
- [ ] 2.2 Unit-style test (or example app harness) exercising the subscribe/unsubscribe lifecycle on a real device

## 3. Rewire usePulse

- [ ] 3.1 Refactor `src/lib/pulse.ts`:
  - On mount, call `healthKit.isAvailable()`
  - If true: subscribe to heart rate, emit samples through the existing hook return shape
  - If false: keep current mock behavior
  - On unmount: unsubscribe (real path) or clearInterval (mock path)
- [ ] 3.2 Add the 10s "no samples" grace period that flips to mock mid-session (per the spec)

## 4. Rewire auto-soften

- [ ] 4.1 In `src/app/session.tsx`, compute `slow` from the real pulse value (not from `pulsePhase`)
- [ ] 4.2 Implement the 105 in / 90 out hysteresis with consecutive-sample requirement (2 in, 3 out)
- [ ] 4.3 Keep the existing `pulsePhase` script as the *fallback* slow-trigger when no real pulse is available (so demos still work)

## 5. Permissions screen wiring

- [ ] 5.1 Replace the placeholder "Allow Apple Health" handler with `healthKit.requestAuthorization()`
- [ ] 5.2 Reflect actual authorization status in the row's "granted" indicator

## 6. Verification

- [ ] 6.1 `npx tsc --noEmit` clean
- [ ] 6.2 `npx expo export --platform web` bundles (web fallback path stays mock)
- [ ] 6.3 Manual on a phone + Apple Watch: grant permission, run a session, verify pulse number updates ~live, verify auto-soften fires when pulse rises
- [ ] 6.4 Manual: deny permission, verify session falls back to mock cleanly
- [ ] 6.5 Manual: mid-session, take off the watch, wait 10s, verify silent fallback to mock
- [ ] 6.6 Inspect: no network requests during a session contain heart-rate data
- [ ] 6.7 `npx -y @fission-ai/openspec validate wire-healthkit-pulse` passes

## 7. Build infrastructure

- [ ] 7.1 Cut a development build (`eas build --profile development --platform ios`) since HealthKit entitlement isn't available in Expo Go
- [ ] 7.2 Document the dev-build flow in `docs/CONVENTIONS.md` (new subsection: "When you need a dev build")
