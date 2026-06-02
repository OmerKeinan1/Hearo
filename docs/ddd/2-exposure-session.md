---
title: "Bounded Context: Exposure Session"
tags: [ddd, bounded-context, core, session]
audience: product, frontend-dev
status: reviewed
---

# ② Exposure Session  *(Core domain)*

> Index: [`README.md`](./README.md) · Spec: [`exposure-session`](../../openspec/specs/exposure-session/spec.md)

**Responsibility:** run the opening→during→calming walk loop — ambient, voice,
trigger entry, breathing, elapsed time, early exit, and the after-walk check-in.

## Tactical model

- **Aggregate root: `Walk`** (a.k.a. exposure session) — `scene`, `phase`, `elapsed`, `triggerClip | null`, `status` (`active | paused | ended`), `breathingPace`.
- **Entities / value objects:** `Phase` (`opening|during|calming`), `BreathingPace` (4s/6s → 5s/8s), `TriggerClip` (a chosen audio variation), `CheckIn` (`still here|shaken|steady` — code: `Reflection`, see Index §1).
- **Domain events:** `WalkBegun`, `PhaseEntered`, `TriggerEntered`, `BreathingPaceChanged`, `WalkPaused` / `WalkResumed` (observed from Crisis Access's `isOpen`), `WalkEndedEarly`, `WalkCompleted`, `CheckInRecorded`.
  - Conceptual — the session is driven by a local time-script + interval today, not an emitted event stream (see gaps).

## Invariants

- Phases occur **in order** `opening → during → calming`; never skipped or reordered.
- A trigger plays **only** for a consented sound; empty consent ⇒ rehearsal walk
  (no trigger, ambient+voice uninterrupted). *(Cross-cutting policy 4.)*
- **No visible pre-trigger warning** — only the ~200ms breathing-circle flash. *(Cross-cutting policy 5.)*
- Display is **elapsed time only** (`m:ss`), never a countdown.
- Early exit **records** the partial walk (not discarded) and routes to After.
- Output respects the absolute ceiling via `TriggerOutputPolicy`. *(Cross-cutting policy 1; owned by [`3-intensity-control.md`](./3-intensity-control.md).)*

## Relationships

- **Downstream conformist** of Crisis Access — observes `isOpen`, pauses/resumes.
- Consumes **Content Provisioning** (Published Language: `Scene`/`Sound`/`VoiceScript`).
- Reads the **ceiling** from Intensity Control and the **consent list / scene**
  from User Profile (read models, at mount).
- Subscribes to **Pulse Monitoring** events to drive calming + auto-attenuation.

## Note on `BreathingPace`

The calming/slow pace is currently switched by the **mock `PulsePhase`**
(`session.tsx:62`, `slow = pulsePhase === "peak" || "settling"`), which is
**time-scripted** by the demo `SCRIPT`, not driven by a live pulse-threshold
crossing. The model's "when pulse crosses threshold" is the *intended* trigger.

## Today (code mapping)

- `src/app/session.tsx`, `src/app/after.tsx`
- `src/lib/session-store.ts` — the *pre-walk selection* read at mount (see [`6-user-profile-consent.md`](./6-user-profile-consent.md))
- `src/lib/audio.ts` (`pickRandomTrigger` = the rehearsal-walk decision)
- `src/components/BreathingCircle.tsx`, `VoiceLine.tsx`, `PulseTicker.tsx`

## Gaps & compliance flags

- **⚠️ Ubiquitous-language drift:** model term **Check-in** vs code type
  `Reflection` (`after.tsx:10`). Reconcile.
- **Check-in persistence:** `CheckInRecorded` is unimplemented — `after.tsx` holds
  the reflection in local `useState` with no store/persistence (only the pulse
  sparkline carries a `TODO(supabase)`).
- **Breathing/calming** is time-scripted, not pulse-threshold-driven (see note).
