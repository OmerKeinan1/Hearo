# ADR-001: Adopt Jest + React Native Testing Library and a risk-weighted coverage gate

- **Status**: proposed
- **Date**: 2026-06-02
- **Deciders**:
- **Tags**: testing, ci, quality, expo

## Context

Hearo is a safety-critical exposure-therapy app for combat veterans. It ships
today with **no test runner, no test files, and no coverage gate** — the only CI
is EAS Update and Android publish. Every regression in crisis access, session
behavior, content provisioning, and the bilingual (EN/Hebrew, RTL) name-parsing
logic is currently caught only by manual testing.

The highest-value, lowest-friction surface is the pure-logic layer in `src/lib`
(~250 LOC of branchy, deterministic code: `displayName.ts`, `content.ts`,
`crisis-store.ts`, `audio.ts`, `storage.ts`, `session-store.ts`, `pulse.ts`).
These encode the therapeutic rules and need no native renderer to test.

The project runs on **Expo SDK 56** (`expo ~56.0.8`, `babel-preset-expo
~56.0.14`, React Native 0.85.3, React 19.2.3 per `package.json`), which pins the
supported test toolchain. (Note: `AGENTS.md` still references SDK 54 — that doc
is stale relative to `package.json` and should be reconciled separately.) A
pending change (`openspec/changes/migrate-content-to-api/`)
will turn `content.ts` getters async against Supabase, so a behavioral baseline
on the current sync contract is needed before that migration.

A full risk-weighted analysis is in `docs/TEST_COVERAGE_PLAN.md`.

## Decision

1. **Adopt `jest-expo` + Jest** as the test runner (the Expo-sanctioned preset
   for SDK 56), with **`@testing-library/react-native`** (+ `jest-native`
   matchers) for component tests. Rejected alternatives: Vitest (no first-class
   Expo/RN preset, Metro transform friction) and Detox/E2E (too heavy for the
   logic-layer ROI we need first).

2. **Test the logic layer first.** Phase 1 targets all of `src/lib` with fast,
   native-free unit tests before any component/E2E work.

3. **Enforce a risk-weighted, ratcheting coverage gate** in CI on PRs to `main`:
   - `src/lib/**`: start at **85% lines / 80% branches** (blocking), ratchet to 95/90.
   - `src/components/**`: report-only initially, 70% target in Phase 2.
   - Thresholds only ever increase.

4. **Configure coverage scope** via `collectCoverageFrom` over `src/lib` and
   `src/components`, excluding pure-constant/config modules (`tokens.ts`,
   `i18n.ts`).

## Consequences

### Positive
- Crisis-access, session, and content logic gain regression protection.
- The `content.ts` suite becomes the safety net for the Supabase migration.
- A blocking CI gate makes coverage a merge requirement, not a hope.
- `jest-expo` keeps the toolchain aligned with the supported SDK.

### Negative
- Adds dev dependencies and a CI `test` job (slower PRs).
- Requires mocking `AsyncStorage` and `expo-device` for some unit tests.
- Hook/timer tests (`pulse.ts`) need fake timers and stubbed randomness.

### Neutral
- React Native version churn occasionally requires `jest-expo` preset bumps.
- Coverage thresholds need periodic review as the ratchet advances.

## Links
- `docs/TEST_COVERAGE_PLAN.md` — risk-weighted module inventory, gaps, phased rollout
- `openspec/changes/migrate-content-to-api/` — async migration this baseline protects
