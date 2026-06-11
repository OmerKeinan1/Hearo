## ADDED Requirements

> **Note:** This spec describes the **intended** behavior of the clinical-screening capability. The current scaffold change ships only the storage shape and a flow-hook comment. The Given/When/Then scenarios below are the contract a future implementation change will be measured against, once Q-01 (screening instrument + thresholds) and Q-04 (whether severe-band hard-blocks autonomous use) are answered by Dr. Hirschman.

### Requirement: Screening result persistence
The app SHALL persist a screening result per device, distinguishing "never asked" (`undefined`) from "explicitly declined" (`null`) from "answered" (a `{ band, score, takenAt, version }` record).

#### Scenario: Never asked
- **WHEN** the user has never opened the screening flow
- **THEN** `getClinicalScreeningResult()` resolves to `undefined`

#### Scenario: Answered
- **WHEN** the user completes the screening with a band classification
- **THEN** `getClinicalScreeningResult()` resolves to the full record (band, score, takenAt timestamp, version string)
- **AND** the record persists across app launches

#### Scenario: Declined
- **WHEN** the user explicitly declines the screening (skip / "prefer not to say")
- **THEN** `getClinicalScreeningResult()` resolves to `null` (distinct from `undefined`)
- **AND** the future-implementation flow treats this band-equivalent to `"moderate"` (mid-risk default) — pending Hirschman sign-off on this default

### Requirement: Onboarding flow placement
The screening flow SHALL sit between Permissions and Setup. The user reaches it on first launch only — subsequent launches go directly to Home.

#### Scenario: First launch after permissions
- **WHEN** the user finishes the Permissions screen on first launch and `getClinicalScreeningResult() === undefined`
- **THEN** the app navigates to `/screening`

#### Scenario: Subsequent launches
- **WHEN** the user has a stored screening result (any of the three states above except undefined)
- **THEN** the app skips `/screening` on launch

### Requirement: Severity-band branching
The screening result's `band` SHALL determine the post-screening route.

#### Scenario: Mild or moderate
- **WHEN** the band resolves to `"mild"` or `"moderate"`
- **THEN** the app routes to `/setup` as today

#### Scenario: Severe — BLOCKED on Q-04
- **WHEN** the band resolves to `"severe"`
- **THEN** the app routes to a referral screen recommending Mativ (or another partner from G-01)
- **AND** depending on Q-04 resolution: either the user is hard-blocked from `/setup` or they see a "continue anyway, with clinician supervision recommended" affordance

### Requirement: Bilingual content
The screening questions and band-routing copy SHALL be available in both Hebrew (source) and English (translation), reviewed by Dr. Hirschman before any external user reaches the screen.

#### Scenario: Hebrew device
- **WHEN** the device language is `he`
- **THEN** all screening questions, instructions, and result copy render in Hebrew, RTL-aligned

#### Scenario: English device
- **WHEN** the device language is `en`
- **THEN** the same content renders in English, LTR-aligned
