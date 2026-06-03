# Handover — audio-engine branch

**Branch:** `audio-engine`
**Date:** 2026-06-03
**Status:** Implementation in progress — stopped mid-session due to token limit.

---

## What is done (committed, reviewed, fixed)

| Commit | What |
|--------|------|
| openspec artifacts | proposal.md, design.md, tasks.md, specs for audio-engine / exposure-session / intensity-control |
| library swap | `react-native-audio-api@0.12.2` replaces `expo-audio`. Pin is exact (not `^`). AGENTS.md + CONVENTIONS.md updated. Dev build required — Expo Go incompatible. |
| `src/lib/audio-engine.ts` | `AudioEngine` class — AudioContext + 3 GainNodes, logarithmic trigger ramp, spike/normalize with 30s grace, voice ducking, crisis-sheet pause via `ctx.suspend`. Bug-fixed after review: curve shape, cancelAndHoldAtTime, onSpike guard, playVoiceClip-during-spike, onended safety net, rampStartTime tracking. |
| `src/hooks/useAudioEngine.ts` | React hook wrapping AudioEngine; cleans up on unmount. |
| `src/hooks/usePulseMonitor.ts` | HR baseline (AMBIENT_FADE_IN), spike detection (15%/8s), normalization (90% baseline), BLE disconnect (8s), chronic high baseline dual-source. Bug-fixed after review: rawBpmRef for stale closure, spike state cleanup on ADAPTIVE_LOOP exit, interval dep array fix, empty-baseline fallback. |
| `src/lib/asset-cache.ts` | CDN manifest → SHA-256 sidecar freshness check → `expo-file-system` download. Partial-file + sidecar-failure cleanup. Concurrency note documented. |
| `src/lib/content.ts` | Added `AmbientTrack`, `VoiceClip`, `isPlaceholderSource()`, `getAmbientTrack()`, `getVoiceClips()`. All marked `TODO(asset)` + `TODO(supabase)`. |
| `src/app/session.tsx` | Full rewrite: 5-state `useReducer` machine, `useAudioEngine`, `usePulseMonitor`, asset loading in LOADING, voice clips at correct moments, manual distress button, intensity slider wired to engine ceiling. **HAS KNOWN BUGS — see below.** |

---

## Known bugs in session.tsx (review found, NOT yet fixed)

These must be fixed before session.tsx is usable. Listed in priority order:

### 1. `startAmbient()` called before `loadBuffers()` — CRASH
**Line ~186.** `engine.startAmbient()` is the first line of the DISCLAIMER effect, but `ambientBuffer` is null until `loadBuffers()` resolves. AudioEngine throws `'ambient buffer not loaded'`.

**Fix:** Move `engine.startAmbient()` into the `.then()` chain after `loadBuffers` resolves.

### 2. Empty string passed as triggerSource to `loadBuffers` — CRASH
**Line ~193.** `engine.loadBuffers("" as unknown as number, ...)` — `decodeAudioData("")` throws and poisons the `Promise.all`, so the ambient buffer is never stored either.

**Fix:** Split `loadBuffers` into two calls, OR add an optional `triggerSource` param to the engine, OR load trigger buffer separately in the ADAPTIVE_LOOP effect. The cleanest fix: add `loadAmbientAndVoice(ambientSource, voiceClipSources)` to `AudioEngine` that skips the trigger, and call it in DISCLAIMER. Load the trigger separately in `startTriggerRamp`.

### 3. User trapped in LOADING if they tap `×` — CLINICAL BLOCKER
**Reducer line ~68.** `LOADING`, `DISCLAIMER`, and `WIND_DOWN` states have no handler for `SESSION_END`. If the user taps close during LOADING (e.g. download stalls), nothing happens.

**Fix:** In the reducer, handle `SESSION_END` from LOADING and DISCLAIMER by going directly to POST_SESSION (skip audio entirely). From WIND_DOWN it can stay as-is (wind-down is already ending).

### 4. Missing i18n keys — all 6 show raw key strings to users
These `t("session.X")` calls have no matching keys in `src/lib/i18n.ts`:
- `session.goBack`
- `session.preparing`
- `session.noWatch`
- `session.watchDisconnected`
- `session.triggerReturnsIn` (also uses `{ seconds }` interpolation)
- `session.lowerSound`

**Fix:** Add these to both `en` and `he` in `i18n.ts`. Example values:
```
goBack: "Go back" / "חזרה"
preparing: "Preparing session…" / "מכין סשן…"
noWatch: "No watch detected. Use the button on screen to lower trigger volume." / "לא זוהה שעון. השתמש בכפתור על המסך להנמכת הצליל."
watchDisconnected: "Watch disconnected. Use the button to control volume manually." / "השעון התנתק. השתמש בכפתור לשליטה ידנית בעוצמה."
triggerReturnsIn: "Sound returns in {{seconds}}s" / "הצליל חוזר בעוד {{seconds}} שניות"
lowerSound: "Lower sound" / "הנמך צליל"
```

### 5. `handleDistressPress` if/else is identical in both branches — minor
Both branches call `handleManualDistress()`. Simplify to a direct call.

### 6. `usePulse` and `PulsePhase` imported but unused — lint warning
Remove from imports in `session.tsx`.

---

## Remaining tasks (not yet started)

From `openspec/changes/audio-engine/tasks.md`:

**Section 7 — Watch disconnect + manual mode UI** (7.1-7.5)
The banner and distress button are in session.tsx already, but tasks 7.1-7.5 should be reviewed against the spec after the session.tsx bugs above are fixed.

**Section 8 — Post-session feedback** (8.1-8.4)
- Create `src/components/features/post-session/` with `index.ts`
- Create feedback screen: 4 questions (difficulty 1-5, trigger impact, mood change, open text)
- Wire POST_SESSION state → feedback screen → After screen
- Currently session.tsx routes directly to `/after`, skipping the form
- Add `TODO(supabase)` marker for feedback storage

**Section 9 — DDD + OpenSpec doc updates** (9.1-9.2)
- `docs/ddd/2-exposure-session.md` — update to 5-state machine, close "breathing is time-scripted" gap note
- `docs/ddd/4-pulse-monitoring.md` — document real event seam + personalized baseline

**Section 10 — Verification** (10.1-10.10)
- Run `npx tsc --noEmit`
- Run `npx expo run:ios` on real device
- All manual verification steps listed in tasks.md

---

## How to resume

1. `git checkout audio-engine` (already on this branch)
2. Read this file + `openspec/changes/audio-engine/tasks.md`
3. Fix the 6 session.tsx bugs listed above (in order — 1 and 2 are crashes, 3 is a clinical blocker)
4. Add i18n keys to `src/lib/i18n.ts`
5. Create post-session feedback feature (section 8 tasks)
6. Update DDD docs (section 9)
7. Run TypeScript check and device test (section 10)
8. When all tasks marked done: `npx -y @fission-ai/openspec validate audio-engine`
9. Merge to `main`

---

## Key files reference

| File | Purpose |
|------|---------|
| `src/lib/audio-engine.ts` | AudioEngine class — Web Audio Graph core |
| `src/hooks/useAudioEngine.ts` | React hook for session screen |
| `src/hooks/usePulseMonitor.ts` | HR baseline, spike/normalize, BLE disconnect |
| `src/lib/asset-cache.ts` | CDN manifest → local file cache |
| `src/lib/content.ts` | Content seam — scenes, sounds, ambient, voice clips |
| `src/app/session.tsx` | Session screen — 5-state machine (**has bugs**) |
| `openspec/changes/audio-engine/` | Full spec, design, tasks |
| `docs/CONVENTIONS.md` | Audio library updated |
| `AGENTS.md` | Dev build requirement added |
