---
title: "Bounded Context: Pulse Monitoring"
tags: [ddd, bounded-context, pulse, privacy]
audience: product, frontend-dev
status: reviewed
---

# ④ Pulse Monitoring  *(Supporting)*

> Index: [`README.md`](./README.md) · PRD: [`../prd.md`](../prd.md) §6.1, §9

**Responsibility:** provide a pulse stream (HealthKit when available, otherwise a
mocked phase-aware generator) and publish spike/normalize signals. **On-device only.**

## Tactical model

**No aggregate.** Pulse Monitoring has no entity whose transactional consistency
must be protected, so it is modeled as **domain services + value objects**, not an
aggregate. (A continuous observable is not a consistency boundary.)

- **Value objects:** `PulseReading` (bpm at a tick); `PulsePhase` (`baseline | rising | peak | settling`) — the mock generator's *behavioral arc*, conceptually **distinct** from the walk's clinical `Phase` ([`2-exposure-session.md`](./2-exposure-session.md)), though the demo script keys one off the other.
- **Domain services:** `PulseSource` (HealthKit stream, or the mock generator fallback); `ThresholdDetector` — decides spike vs normal (~105 bpm, currently un-personalized — an open risk in [`../prd.md`](../prd.md) §12).
- **Domain events:** `PulseSampled`, `PulseSpiked`, `PulseNormalized`.

## Invariants

- The pulse stream **stays on-device**; never posted to Supabase unless the user
  explicitly shares a walk (privacy boundary, [`../prd.md`](../prd.md) §9).
  *(Cross-cutting policy 3.)*
- Falls back to the mocked phase-aware generator when HealthKit is unavailable.

## Relationships

- Publishes `PulseSpiked`/`PulseNormalized` to Exposure Session (calming switch)
  and Intensity Control (auto-attenuation floor).
- Future ACL to **HealthKit / Apple Watch** keeps device types out of the domain.

## Today (code mapping)

- `src/lib/pulse.ts` (`usePulse` = the mock generator + clamping; exports `PulsePhase`).
- No `PulseSpiked`/`PulseNormalized` event seam yet. HealthKit adapter is a future ACL.

## Gaps

- **No event seam** — `pulse.ts` only produces a value; the calming/attenuation
  reactions are time-scripted via the mock `PulsePhase`, not driven by live
  threshold crossings.
- **Threshold un-personalized** (~105 bpm fixed) — a clinical risk per PRD §12.
