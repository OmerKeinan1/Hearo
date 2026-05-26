## Why

The app's content is hard-coded and scattered, and it has already produced a visible bug: the session voice script is fixed to the river ("You're walking along the river…") and plays for *every* scene, so choosing Park and hearing about a river is a label/content mismatch. Scene imagery is worse — the URLs are unverified guesses that may show the wrong place or fail to load.

The root cause is that a "scene" is not modeled as one coherent thing. Its pieces live in three files: the label in `i18n.ts`, the image + tint in `SceneBackground.tsx`, and the voice script (river-only) in `i18n.ts` again, with the timeline in `session.tsx`. Nothing keeps them in sync.

This change introduces a single content-provisioning seam so each scene is one coherent bundle (label + media + its own voice script), fixes the per-scene voice mismatch now, and marks every hard-coded data site with a `TODO(api)` pointing at the endpoint that will eventually serve it — so the backend swap is a one-file change, not an archaeology project.

## What Changes

- Introduce `ui/src/lib/content.ts` — a typed adapter that returns scenes, sounds, and voice scripts in the **same shape the API will return** (mirrors `server/openapi.yaml`). Today it returns local/bundled data; later it calls the backend. Screens and components consume this seam instead of reaching into scattered constants.
- Model a **scene** as one bundle: `{ key, label{en,he}, media, tint, voice{opening,during,calming}{en,he} }`. Fixes the river-for-every-scene bug — Park gets park words, Cafe gets cafe words.
- Replace the unverified Unsplash hotlinks with bundled, scene-accurate media in `ui/assets/scenes/` (still images for the picker, looping video for the active session — see design.md).
- Add `TODO(api)` markers at every hard-coded data site, each naming its target endpoint, so they're greppable and traceable to `server/openapi.yaml`.
- Move the mocked pulse thresholds, the session timeline, the default preferences, the user name, and the after-screen sparkline behind the same seam (or mark them clearly) rather than leaving them inline.

## Capabilities

### New Capabilities

- `content-provisioning`: how the app sources its scenes, sounds, voice scripts, and session config — through one typed adapter that's local now and API-backed later, with every hard-coded site marked for migration.

### Modified Capabilities

- `exposure-session`: the requirement that voice content matches the chosen scene is currently violated (river voice on every scene). This change adds a requirement that the voice script is scene-specific.

## Impact

- **New file**: `ui/src/lib/content.ts` (the adapter seam).
- **New assets**: `ui/assets/scenes/` — per-scene still + looping video (team-produced; integration in scope).
- **Edited**: `SceneBackground.tsx` (consume content seam, support video), `session.tsx` (scene-specific voice + timeline from seam), `i18n.ts` (voice scripts move out of generic keys into per-scene content), `session-store.ts` (defaults from seam), `pulse.ts` (thresholds named/marked), `after.tsx` (sparkline from session record, marked), `home.tsx` (user name marked `TODO(api)`).
- **No backend built here.** This is the client-side seam + TODO markers + the per-scene content fix. The actual API calls land when the backend exists; the adapter is where they plug in.
- **Traceability**: every `TODO(api)` references an endpoint already defined in `server/openapi.yaml` (`/scenes`, `/sounds`, `/voice-lines`, `/preferences`, `/sessions`, `/users/me`).
