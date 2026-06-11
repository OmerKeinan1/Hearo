---
title: Feature backlog
tags: [product, planning, backlog]
audience: everyone
status: draft
---

# Feature backlog

The discussion document for what's next. Each item is a candidate for an [OpenSpec change](../openspec/changes/) once we agree on scope. This file is meant to be edited inline — strike items, re-prioritize, add to the open questions.

## Strategic context

After the 9 June 2026 meeting with Dr. Michal Hirschman (see `meeting-summary` in shared drive), the team **pivoted** away from "severe PTSD with close clinical supervision" toward **mild-to-moderate PTSD with low entry barriers** — a population not currently getting adequate care. The clinical reasoning: self-guided exposure is safe enough for mild/moderate symptoms, and uncontrolled exposure in severe cases risks re-traumatization. Screening on intake becomes the safety bound.

The earlier [`introduce-therapist-managed-care`](../openspec/changes/introduce-therapist-managed-care/) plan is **not dead** — it becomes Tier 2 (Companion mode) alongside human treatment, no longer the only mode.

### The two tiers, post-pivot

| Tier | Audience | Onboarding | Default |
|---|---|---|---|
| **Self-guided** | Mild–moderate PTSD; not in active clinical care | Screening questionnaire → green-lit → first session with psycho-education | The new default |
| **Companion** (formerly "managed care") | Moderate cases working with a clinician | Invited by their therapist via email link | Tier 2; deferred |
| _(out of scope)_ | Severe PTSD | _Screened out → referred to Mativ_ | Never — re-traumatization risk |

---

## Backlog — pre-launch (clinical safety blockers)

These three items are gates on letting any real user touch the app. None should ship to public users without all three landed.

### B-01 — Clinical screening questionnaire (onboarding)

**Why.** Without a screening filter, severe PTSD cases can enter self-guided exposure and get re-traumatized. Dr. Hirschman flagged this as the highest-risk failure mode of the pivot.

**Scope.** A validated questionnaire (likely PCL-5 or equivalent — clinical decision pending) shown immediately after the welcome screen on first launch. Score thresholds:
- **Mild/moderate** → continue into the app
- **Severe** → soft block with a referral message ("HearO isn't the right fit for what you're experiencing. We recommend reaching out to the Mativ Institute / your GP / etc.") + ERAN 1201 + a "talk to someone now" CTA
- **Edge** scores → optionally route to Companion (Tier 2) if available

Stores: the user's last screening score, date of screening, severity tier. Drives downstream routing.

**Source.** Doc 3, §5 (Onboarding) + Open Question 1
**Status.** Proposed — awaiting clinical questionnaire choice from Dr. Hirschman
**Size.** M (1–2 weeks once the questionnaire is chosen)
**Owner.** Dr. Hirschman + Omer (questionnaire); engineering after that
**Blocks.** Public launch
**Depends on.** Decision on which validated instrument to use; copy & translation review

### B-02 — Pre-session psycho-education (first session only)

**Why.** Doc 1's argument: users need to understand *why* their body responds the way it does — the amygdala-as-smoke-detector framing — before exposure makes sense. Without this context the first session can feel arbitrary or scary.

**Scope.** A short screen sequence (3–5 cards) shown **before the first session ever begins**, after onboarding completes. Content adapts the Doc 1 script:
- The amygdala as a smoke detector
- Why it stays sensitive after the threat passes
- Why everyday triggers cause false alarms
- The frame: distress isn't brokenness, it's an effective system stuck on emergency settings
- "In this practice we'll gently teach the system that the danger has passed"

After viewing once, persist a "completed-psychoed" flag and never show again. Available to re-read from settings.

**Source.** Doc 1
**Status.** Proposed
**Size.** S (~3 days)
**Owner.** Engineering; clinical copy review by Dr. Hirschman
**Depends on.** B-01 (screening happens first)

### B-03 — In-session calming protocol (self-tap distress button)

**Why.** Doc 2's de-escalation script for when the user crosses a distress threshold *during* a session. Distinct from the existing ERAN crisis sheet — softer, embedded in the therapeutic process, doesn't end the relationship with the app, just pauses this session and recovers.

**Scope.** A "lower sound / I need a break" button visible during ADAPTIVE_LOOP. Tap → enter the calming protocol overlay (full-screen takeover, suspends the session timer):
1. **Validate**: "Anxiety is like a wave. It will peak and weaken. I'm with you."
2. **Ground**: instructions to sit, plant feet, feel weight on chair
3. **Box breathing 4-4-4-4** with narrator counting + breath sounds (already partially in the audio engine — needs voice clip + visual)
4. **3-2-1 sensory grounding**: 3 things you can see / 2 you can hear / 1 you can touch
5. **Resolution**: another deep breath, drink water, "the wave has passed"
6. **Permission to stop**: "Today's session ends here. You did important work."
7. **Aftercare**: curated list of calming videos / sounds (links to YouTube / bundled)

**v1 trigger:** self-tap only (the lever already partially exists in `session.tsx` as `handleManualDistress`)
**v2 trigger (future):** body metrics — HR spike + sustained elevation → auto-route into this protocol instead of just attenuating the trigger. Replaces or augments the current `onSpike` → fade-trigger behavior.

**Source.** Doc 2 + user clarification (v1 self-tap, v2 HR-driven)
**Status.** Proposed (v1); v2 deferred
**Size.** M (v1); L (v2 includes the body-metrics integration after the audio-engine spike-detection bug is fixed)
**Owner.** Engineering; voice clips from Dr. Hirschman / clinical team; aftercare-content curation TBD
**Depends on.** Audio engine voice clips (DISCLAIMER / MID_SESSION / WIND_DOWN are TODO placeholders today; calming clips add at least one more); clinical copy review

---

## Backlog — onboarding & routing

### O-01 — Two-tier routing decision in onboarding

**Why.** Once we have a screening (B-01), we need to actually route the user. Mild → straight into self-guided app. Moderate → choice between self-guided or "would you like a clinician to accompany you" (Companion mode, when that exists). Severe → soft block.

**Scope.** Routing logic + the UI for the "moderate" branch's choice screen. Tied to the screening score.

**Status.** Proposed; meaningful only after B-01 lands
**Size.** S
**Depends on.** B-01

### O-02 — Display name capture in onboarding

**Why.** Currently we pull display name from device (iOS 16+ blocks this), with a graceful fallback to a no-name greeting. If we're doing real onboarding for clinical screening anyway, we can ask once during that flow and persist properly.

**Scope.** Add a name field to the onboarding step right after permissions. Skippable. Stores into existing `lib/storage.ts` displayName key. Removes reliance on `expo-device` for the common case.

**Status.** Proposed (small quality-of-life)
**Size.** XS

---

## Backlog — companion mode (Tier 2, deferred)

### C-01 — Therapist invite + dashboard

**Why.** Originally the default flow. Post-pivot, it's the support tier for moderate patients working with a clinician. Same architecture as the [`introduce-therapist-managed-care`](../openspec/changes/introduce-therapist-managed-care/) openspec change — but reframed as Tier 2 (opt-in alongside self-guided), not the only path.

**Scope.** Already specified in detail under `introduce-therapist-managed-care/` — proposal, design, capability specs, tasks. Six implementation phases.

**Status.** Proposed (plan-only PR merged) — implementation deferred
**Size.** XL (4–6 weeks per the existing plan)
**Owner.** TBD when prioritized
**Depends on.** B-01 (need screening before companion routing makes sense); team capacity after pre-launch blockers ship

---

## Backlog — research & data

### R-01 — Anonymous research data collection (opt-in)

**Why.** Doc 3 §6: long-term aspiration to contribute to digital-trauma-treatment research. Anonymized session metrics (with explicit user consent) are the path to institutional collaborations with HMOs, IDF, academic partners.

**Scope.** A consent flow during onboarding ("Would you like to contribute anonymized data to research?"). If accepted: a Supabase ingestion endpoint receives de-identified session records (scene, sound used, intensity ceiling, pulse curve hash, reflection answer — never tied to user identity). Revocable from settings.

**Status.** Proposed — needs ethics review + data-model design first
**Size.** L (small as a feature, large as a compliance project)
**Depends on.** Regulatory framework decision (G-02 below); R-02 (Helsinki approval)

### R-02 — Helsinki / IRB approval prep

**Why.** Doc 3 Open Question 5. For any data we collect for research purposes, Israeli law requires Helsinki Committee approval. Without it, even consented data collection can't be used in published research.

**Scope.** Documentation prep: research question framing, informed consent text, anonymization protocol, data retention plan. Submit to a Helsinki committee (typically through a partner institution — Mativ?).

**Status.** Proposed
**Size.** L (administrative + clinical writing; multi-month review cycle)
**Owner.** Clinical team + external legal counsel
**Depends on.** Partner institution that can sponsor the submission

---

## Backlog — regulatory & ops

### G-01 — Mativ referral protocol

**Why.** Doc 3 Open Question 3. Both directions: severe cases screened OUT of HearO need a clear path to Mativ; Mativ patients with mild/moderate symptoms need a clear referral path INTO HearO.

**Scope.** A documented reciprocal protocol (likely a short PDF + a shared form). Plus an in-app referral surface: when the screening blocks a user, show Mativ contact info + a "ready to reach out?" CTA.

**Status.** Proposed
**Size.** M (mostly process + agreement, not engineering)
**Owner.** Omer + Roy Davidovic
**Depends on.** Discussion with Mativ leadership

### G-02 — Regulatory classification decision (SaMD vs Wellness)

**Why.** Doc 3 Open Question 5. The app's classification dictates everything downstream: clinical trial requirements, FDA/CE/AMAR pathways, privacy posture, claims we can make, time-to-market.

**Scope.** External legal consultation to determine whether HearO is:
- **Wellness app** — lower bar, no medical-device claims, no clinical trials required. Most apps in our space land here.
- **Software as Medical Device (SaMD)** — higher bar, FDA/AMAR review, but enables medical claims and reimbursement.

**Status.** Proposed
**Size.** M (legal consultation, not engineering)
**Owner.** Team + external legal counsel
**Depends on.** Roadmap clarity on whether we want to pursue medical claims

### G-03 — HIPAA / GDPR / Israeli privacy law compliance review

**Why.** Once we store any user data server-side (whether self-guided or Companion mode), we're handling clinically-sensitive PII.

**Scope.** Compliance review by legal counsel. Output: updated privacy policy, data flow diagrams, breach response plan, data residency decisions (we already host on Supabase EU per the privacy policy).

**Status.** Proposed
**Size.** M
**Depends on.** G-02 (classification decision affects what's required)

### G-04 — Apple TestFlight CI/CD

**Why.** Doc 3 action item (Dekel). Currently we have no path to distribute to iOS testers without a paid Apple Developer Program enrollment + the TestFlight upload pipeline.

**Scope.** GitHub Action that runs `eas build --profile preview --platform ios` on a release tag and submits to TestFlight via `eas submit -p ios --latest`. Requires:
- Apple Developer Program enrollment ($99/yr)
- App Store Connect app record created
- App Specific Password or API key configured in GitHub secrets

**Status.** Blocked on Apple Developer Program enrollment
**Size.** S (engineering); L (calendar — Apple enrollment can take 24-48 hr)
**Owner.** Dekel
**Depends on.** Repo transfer to Hear-o org complete (so Dekel has Admin / can manage secrets) — see Q-01 in open questions

---

## Open work-in-flight (carried over from prior planning)

These aren't new backlog items — they're tasks already in motion that affect prioritization.

| Item | Status |
|---|---|
| Audio engine review fixes (4 must-fix items: `usePulseMonitor` type error, `/audio-test` exposure, `getAmbientTrack` non-determinism, no hooks coverage) | Proposed in review doc; not yet PR'd. **Must land before B-03 v2 (HR-driven calming) can work.** |
| Repo transfer `OmerKeinan1/Hearo` → `Hear-o/Hearo` org | Decided, not yet executed. Blocks G-04 and Ido/Dekel CI/CD setup. |
| Branch protection rule (`main` requires 1 approval + green checks) | Decided, not yet enabled. Worth doing on `OmerKeinan1` even pre-transfer; rule travels with the repo. |
| Phone E2E testing of audio engine on real device | Blocked on cutting a dev build (Android free / iOS needs Apple enrollment). |
| Marketing site Hebrew translation | Considered earlier, no decision. |

---

## Open questions (not yet ready for the backlog)

| Q | Detail | Owner |
|---|---|---|
| **Q-01** | Which validated PTSD screening instrument do we use? PCL-5 is the obvious candidate; alternatives like PHQ-9 PTSD module or shorter screeners might fit "low entry barriers" better. | Dr. Hirschman + Omer |
| **Q-02** | What are the exact severity score thresholds for "self-guided allowed" vs "severe → refer out"? PCL-5 has conventional cutoffs but they're for diagnosis, not for "safe to use a self-guided app". | Dr. Hirschman |
| **Q-03** | Should the calming protocol (B-03) play voice clips like the main session, or use only on-screen text + breathing animation + ambient calming sound? Voice-heavy is warmer; text-only is faster to ship. | Clinical team |
| **Q-04** | Aftercare content (B-03 final step): bundled with the app, linked to YouTube playlist, hosted on hearoapp.vercel.app, or pulled from a CDN content library? | Team |
| **Q-05** | Can the autonomous self-guided model work *without* any human accompaniment for mild cases, or do we always need at least a "if it gets worse, reach out to X" handoff? (Doc 3 Open Question 4) | Dr. Hirschman |
| **Q-06** | Onboarding language: Hebrew-first or bilingual EN/HE from day one? Currently the app supports both, but the screening questionnaire's validated translation might only exist in one. | Clinical + product |

---

## How to use this doc

- **Add to it freely.** New ideas → "Backlog — onboarding & routing" or a new section as needed.
- **Strike items as they ship.** Mark Status as `Shipped` and link the PR.
- **Promote to OpenSpec when ready.** When an item's scope is firm and it's next-up to build, create an `openspec/changes/<name>/` proposal from it.
- **Discuss open questions inline.** Add Owner + a date target on each Q row when it gets assigned.

Last updated: this commit's date. See `git log docs/backlog.md` for history.
