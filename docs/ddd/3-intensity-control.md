---
title: "Bounded Context: Intensity Control"
tags: [ddd, bounded-context, safety, intensity]
audience: product, frontend-dev
status: reviewed
---

# ③ Intensity Control  *(Supporting — safety capability)*

> Index: [`README.md`](./README.md) · Spec: [`intensity-control`](../../openspec/specs/intensity-control/spec.md)

**Responsibility:** enforce the user's volume **ceiling** on the trigger sound;
smooth manual drag; remember the ceiling per sound. This is a *safety* capability
— the exposure model rests on the user trusting they stay in control.

## Two separable concerns (the original model conflated these)

1. **In-walk enforcement** — the live `actualOutput ≤ ceiling` rule. Not a
   stand-alone aggregate; `actualOutput` is computed *inside* the walk
   (`session.tsx:102`), so the rule is modeled as a **domain service,
   `TriggerOutputPolicy`**, owned here and invoked by Exposure Session, fed by
   Pulse Monitoring.
2. **Cross-session memory** — the remembered ceiling **per sound**. This is durable
   user data, owned as a value object in **User Profile & Consent**
   ([`6-user-profile-consent.md`](./6-user-profile-consent.md)), read here at walk
   start. (The current code has neither per-sound identity nor persistence.)

## Tactical model

- **Value objects:** `Ceiling` (continuous, no numeric label), `Attenuation` (delta below ceiling).
- **Domain service:** `TriggerOutputPolicy` — computes `actualOutput` from ceiling + pulse-driven floor.
- **Domain events (conceptual):** `CeilingAdjusted`, `OutputAttenuated`, `OutputRampedToCeiling`, `CeilingPersisted`.

## Invariants (the central safety rule of the whole product)

- **`actualOutput ≤ ceiling`, always.** Auto-attenuation may lower output but the
  system can **never** raise it above the user's manual ceiling. *(Owned by
  `TriggerOutputPolicy`, not a single aggregate — it spans the ceiling input and
  the pulse-driven floor. Cross-cutting policy 1.)*
- The control only affects **trigger volume** — ambient and voice are untouched.
- **User input wins** any in-flight auto-animation (grab cancels animation immediately).
- **No mute / no off** — the softest extreme attenuates but never fully silences.
- The end-of-walk ceiling **persists** as the next default ceiling for that sound.

## Relationships

- Provides the **ceiling** constraint to Exposure Session (upstream constraint).
- Consumes `PulseSpiked`/`PulseNormalized` from Pulse Monitoring to set the floor.
- Reads/writes per-sound ceiling memory in User Profile.

## Today (code mapping)

- `src/components/IntensitySlider.tsx` renders the ceiling + ghost (`effective`) output.
- A **rudimentary auto-attenuation already exists** in `session.tsx:102`
  (`autoFloor = slow ? Math.min(ceiling, 0.35) : ceiling`, applied to player volume).

## Gaps

- **Missing is cross-session per-sound persistence** (`CeilingPersisted` /
  `ceilingMemory`) and a **personalized** threshold — *not* auto-attenuation
  itself, which partially exists.
- `TriggerOutputPolicy` is not a real module yet; the logic is inline in `session.tsx`.
