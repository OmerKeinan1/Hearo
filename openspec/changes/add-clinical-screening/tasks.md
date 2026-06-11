## Status: scaffold only

This change ships the architecture (spec + storage shape + flow hook comment). The questionnaire UI and gating logic are blocked on Q-01 + Q-04 from Dr. Hirschman (see [`docs/backlog.md#3-open-clinical--legal-questions`](../../../docs/backlog.md#3-open-clinical--legal-questions)). Implementation tasks (§2 onward) are listed as a forward-looking checklist but are NOT done in this change.

## 1. Architecture (this change)

- [x] 1.1 Add `ClinicalScreeningResult` type + `getClinicalScreeningResult()` / `setClinicalScreeningResult()` to `src/lib/storage/storage.ts`. Result shape: `{ band: "mild" | "moderate" | "severe"; score: number; takenAt: number; version: string } | null` (null = explicit decline to answer; undefined = never asked).
- [x] 1.2 Unit-test the round-trip + the undefined-vs-null distinction in `src/lib/storage/__tests__/storage.test.ts`.
- [x] 1.3 Add `// TODO(B-01)` comment in `src/app/permissions.tsx` at the point where the screening route would hook in (right before the route to `/setup`), referencing this change and the blocking questions.
- [x] 1.4 `npx -y @fission-ai/openspec validate add-clinical-screening` passes.

## 2. Implementation (BLOCKED — separate future change)

These are written here so the next implementer doesn't restart from zero. They land in a separate openspec change `implement-clinical-screening` once Q-01 + Q-04 are answered.

- [ ] 2.1 **BLOCKED on Q-01.** Decide screening instrument. Default candidate: PCL-5 (20 items, validated, public domain). Alternative: Hirschman-authored short-form.
- [ ] 2.2 **BLOCKED on Q-01.** Define severity bands (cutoff scores).
- [ ] 2.3 **BLOCKED on Q-04.** Decide whether `severe` band hard-blocks autonomous use or merely surfaces a referral with a "continue anyway" option. Hirschman's call.
- [ ] 2.4 Implement `/screening` route. UI: one question per screen, progress dots, no back-button after the first question (questionnaire research suggests this reduces gaming the answer set).
- [ ] 2.5 On completion: compute band, persist via `setClinicalScreeningResult`, branch based on band.
- [ ] 2.6 Insert `/screening` in the onboarding flow at the point marked by `TODO(B-01)` in `permissions.tsx`.
- [ ] 2.7 Build the severe-band routing UI: "we recommend Mativ" card + deep-link (G-01).
- [ ] 2.8 Document the screening tool + threshold rationale in `docs/research/clinical-screening.md` with attribution to Hirschman + cited literature.
