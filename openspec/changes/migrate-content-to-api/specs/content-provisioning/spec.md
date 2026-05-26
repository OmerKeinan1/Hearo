## ADDED Requirements

### Requirement: Single content adapter
The app SHALL source all scenes, sounds, voice scripts, and default preferences through one adapter module (`lib/content.ts`). Screens and components MUST NOT read scattered content constants directly.

#### Scenario: Screen reads a scene
- **WHEN** the Session screen needs the active scene's media and voice script
- **THEN** it obtains them from the content adapter
- **AND** it does not import scene data from `SceneBackground.tsx` constants or generic `i18n` voice keys

### Requirement: Adapter mirrors the API shape
The adapter's return types SHALL match the response schemas defined in `server/openapi.yaml`, so swapping local data for backend calls does not change call sites.

#### Scenario: Local and remote parity
- **WHEN** the adapter returns a scene locally
- **THEN** the object shape matches the `Scene` schema served by `GET /scenes`
- **AND** replacing the adapter body with a `fetch` requires no change to consuming screens beyond awaiting the result

### Requirement: Hard-coded sites are marked and traceable
Every remaining hard-coded data site that should eventually be API-served SHALL carry a `TODO(api)` comment naming its target endpoint.

#### Scenario: Markers are greppable
- **WHEN** a developer runs `grep -rn "TODO(api)" ui/src`
- **THEN** each hard-coded content site (user name, session timeline, pulse thresholds, after-screen sparkline) appears
- **AND** each marker names the endpoint from `openapi.yaml` that will replace it

#### Scenario: Intentional constants are exempt
- **WHEN** a value is region configuration rather than enriched content (e.g. the ERAN crisis number)
- **THEN** it MAY remain hard-coded
- **AND** it carries a comment stating the omission is intentional

### Requirement: Graceful media fallback
The content adapter SHALL provide a still image for every scene and MAY provide a looping video. Consumers MUST fall back to the still when video is absent or fails to load.

#### Scenario: Video missing or fails
- **WHEN** a scene has no video, or the video fails to load
- **THEN** the Session background renders the scene's still image under the same dark overlay
- **AND** the session is otherwise unaffected
