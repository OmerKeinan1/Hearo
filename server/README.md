# HearO — Server API

This directory describes the backend API the **mobile UI** in [`../ui`](../ui) expects. It is the contract between the two halves of the project. Implementation lives wherever the backend team decides to build it (separate repo, separate service, monolith, doesn't matter) — but the shape of the requests and responses is defined here.

> **Canonical spec:** [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.1).
> This README is the human-readable companion that explains *why* each endpoint exists and which screen calls it.

## What the UI needs the backend for

The mobile app runs end-to-end without a backend (mocked pulse, local scene/sound state, no persistence). The backend exists to do three things:

1. **Identify the user.** So we know whose data this is, and so the user can move to a new device without losing their progress.
2. **Persist preferences and history.** So *what scene the user picked*, *which sounds they've consented to hear*, *the intensity ceiling they ended last session on*, and *their pulse curve over time* survive past the current device session.
3. **Serve content the team can update without an app release.** Scene labels, voice-line scripts, sound library — so we don't ship a new TestFlight build every time we tweak copy.

Anything that can be safely client-only — UI state, animation timing, the pulse stream itself (from HealthKit) — stays client-only.

## Auth model

The UI uses **Firebase Authentication** on the device (sign-in with Apple / Google / phone). Every backend request includes the Firebase ID token in `Authorization: Bearer <token>`. The backend verifies it via the Firebase Admin SDK on each request — no separate session exchange, no separate user table for credentials.

The backend's `users` record is keyed by the Firebase UID and contains *only* product-level data (display name, language preference, created date). No passwords. No tokens stored server-side.

## Endpoint groups

### Identity — `/users/me`

| Method | Path        | Used by             |
|--------|-------------|---------------------|
| GET    | `/users/me` | Home screen (greeting), Welcome screen (post-auth bootstrap) |
| PATCH  | `/users/me` | Permissions screen (set displayName on first run) |

Returns the user record. The Home screen's `good evening, shai.` greeting comes from `displayName`. On first run after sign-in, the UI calls PATCH to set the name; subsequently it's a read.

### Content — `/scenes`, `/sounds`, `/voice-lines`

| Method | Path           | Used by               |
|--------|----------------|-----------------------|
| GET    | `/scenes`      | Setup screen (scene picker), Session screen (background image) |
| GET    | `/sounds`      | Setup screen (sound list) |
| GET    | `/voice-lines` | Session screen (scripted narration) |

These return the catalog of available scenes, trigger sounds, and voice lines. Returned as flat lists with both EN and HE labels in the same payload — the UI picks the right language at render time. Audio/image assets are returned as CDN URLs.

For v1 the UI can also ship with content hardcoded (it already does — see `ui/src/lib/i18n.ts`). The endpoints exist so we can grow the catalog without an app update.

### Preferences — `/preferences`

| Method | Path           | Used by               |
|--------|----------------|-----------------------|
| GET    | `/preferences` | Home screen (load today's walk), Setup screen (initial state) |
| PUT    | `/preferences` | Setup screen (`ready →`), Session screen (when the intensity ceiling shifts during use) |

The user's persistent selections: current scene, consented sounds, learned intensity ceilings (one float per sound, in `[0, 1]`).

The intensity ceiling is the most important field to persist correctly — it's the "memory" that means a veteran who softened the motorcycle today doesn't get blasted at full volume tomorrow.

### Sessions — `/sessions`

| Method | Path           | Used by               |
|--------|----------------|-----------------------|
| POST   | `/sessions`    | After screen (`done` tap) |
| GET    | `/sessions`    | Future "your journey" view (not in v1 UI) |

A `SessionRecord` is the full record of one walk: scene, sounds played, the pulse curve sampled at ~4 Hz, intensity ceilings used, reflection answer (`still-here` / `shaken` / `steady`), and timestamps.

We post these for two reasons: (a) so the user can see their progress over time, and (b) so we can analyze in aggregate which sounds people are getting comfortable with and which they keep softening — that informs how we grow the content library.

### Reminders — `/reminders`

| Method | Path             | Used by               |
|--------|------------------|-----------------------|
| POST   | `/reminders`     | Permissions screen (after granting notifications) |
| GET    | `/reminders`     | Settings (not in v1 UI) |
| DELETE | `/reminders/:id` | Settings (not in v1 UI) |

The backend sends the daily push reminder ("today's walk is ready") at the user's chosen time. The UI doesn't need to know the underlying push provider — it just hands the backend a time + days-of-week + timezone.

## What's intentionally NOT in the API

- **Pulse stream.** Live HR comes from HealthKit on-device. Only the *summary* (sampled curve) gets posted at session end. The UI does not stream pulse to the server.
- **Audio playback control.** The UI loads sound assets once (via the CDN URLs from `/scenes` and `/sounds`) and plays them locally. The server is not in the audio path.
- **Real-time crisis interventions.** The crisis sheet calls ERAN 1201 via `tel:` URI directly. The backend does not see crisis taps. This is a privacy and latency decision, and a deliberate one.
- **Authentication credential storage.** Firebase owns this entirely.

## Versioning

The API base URL includes a version prefix (`/v1/...`). Breaking changes get a new prefix. Additive changes (new fields, new endpoints) ship under the same version.

## Where the spec lives

[`openapi.yaml`](./openapi.yaml) is the machine-readable source of truth. It can be:

- Rendered into a browseable docs site (Redoc, Swagger UI, Stoplight).
- Used to generate TypeScript types for the UI client (via `openapi-typescript` or similar).
- Used to generate server stubs (via `openapi-generator`).

When the backend team starts building, generate types into `../ui/src/lib/api/types.ts` so the UI is type-safe against the spec.
