## Why

Per the 2026-06-09 meeting with Dr. Hirschman (see [`docs/backlog.md#b-01`](../../../docs/backlog.md#b-01--clinical-screening-at-onboarding)), the strategic pivot from "severe PTSD with clinical supervision" to "mild/moderate self-guided" is only safe if severe cases are filtered out of the self-guided flow. The whole defensibility of solo exposure rests on the screening gate.

This change captures the **architecture** of the screening flow today — storage shape, integration points, route placement, severity bands, downstream branching — so future implementation work has a written home. It does NOT ship the questionnaire UI or any gating logic. Both depend on:

- **Q-01** — Dr. Hirschman's operational definition of "mild/moderate" and the PCL-5 cutoff she'd recommend.
- **Q-04** — her judgment on whether any autonomous app use is safe without a clinician, or whether companion-mode-light is always the floor.

Until both questions are answered, shipping a screening UI would either be **vapor** (no real gate behind it — false confidence) or **wrong** (a gate with arbitrary thresholds — actively harmful). The right move is to fix the architecture now, write the spec, and leave the implementation pending.

## What Changes

- **Architecture only**:
  - New `clinical-screening` capability spec describing the intended flow (Given/When/Then) — no implementation yet.
  - New `ClinicalScreeningResult` type in `lib/storage/storage.ts` + matching `getClinicalScreeningResult()` / `setClinicalScreeningResult()` getters. The setters work; the getter returns `undefined` for "never screened." Nothing calls them yet.
  - A `// TODO(B-01)` comment in `src/app/permissions.tsx` (the screen that today routes to `/setup`) marking where the screening route would insert: between permissions and setup.
- **No UI** — `src/app/screening.tsx` is NOT created in this change. It's the next change after Hirschman input arrives.
- **No flow change** — `permissions.tsx` continues to route to `/setup` as today.

## Capabilities

### New Capabilities

- `clinical-screening`: severity-band screening at onboarding. Today: spec only, scaffold storage shape. Future v1: PCL-5 questionnaire after permissions, before setup; severe band routes to Mativ referral, mild/moderate continues into the app.

### Modified Capabilities

None in this change. Future implementation will modify `exposure-session` (severe cases gated out) and `home-personalization` (onboarding ordering).

## Out of scope

- The actual questionnaire (PCL-5 question text, scoring, threshold).
- The severe-case routing UI ("we recommend Mativ" card, deep-link to a Mativ landing page).
- Any production gating — until Hirschman signs off, no user is filtered.

## Impact

- **Edited**: `src/lib/storage/storage.ts` — new `ClinicalScreeningResult` type + getter/setter. Trivial: stores a discriminated union (`{ band: "mild" | "moderate" | "severe"; score: number; takenAt: number; version: string }` | `null`) so the shape can evolve as the questionnaire does.
- **Edited (one line)**: `src/app/permissions.tsx` — TODO comment naming where the screening route will hook in.
- **No new screens, no flow change, no new dependencies.**

The setter is exported so a test can populate it, but no code path writes to it. The getter is exported for future use by `home.tsx` (gating Begin) and `permissions.tsx` (routing decision). Today both call sites do nothing with it.

## Why scaffold-only and not "stub with placeholder threshold"

Considered: ship the screen with a placeholder PCL-5 and route everyone to "mild" for now, with a TODO. Rejected because:

1. **Shipping a clinical questionnaire is a clinical claim.** Even if the gate is a no-op, a user who answers it and is told nothing has been told *something*. Until the threshold is real, the questionnaire is misleading.
2. **The right answer might not be PCL-5.** Hirschman's session distinguished mild/moderate from severe in a way that may not map cleanly to PCL-5's clinical-cluster scoring. A scaffold with PCL-5 baked in pre-commits us.
3. **Scaffolding the storage type is enough.** Once Hirschman responds with the screening instrument and threshold, the implementation change is small (one screen, one route hook, real scoring) and can land fast — the architecture is already agreed.
