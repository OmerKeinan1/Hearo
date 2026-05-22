# HearO

A quiet place to walk again.

HearO is a mobile app for veterans living with combat-related PTSD. It uses gradual, consent-based sound exposure — ambient soundscapes layered with user-chosen trigger sounds — guided by a pre-recorded voice and watched over by the user's Apple Watch pulse. The user has two control layers: a manual intensity dial that's always reachable, and an automatic pulse-driven response that softens things when their body starts to spike. Both can only make things softer, never louder. No popups. No alarms. The app does the work the user shouldn't have to.

> For visual design, screen specs, and frontend implementation details, see [FRONTEND.md](./FRONTEND.md).

## The user we're designing for

A combat veteran. Possibly currently serving, possibly discharged. Knows their triggers. Wants tools, not therapy-marketing. Cares about privacy. Skeptical of "wellness apps" and allergic to the word *hero*.

**Hard constraints driven by this persona:**

- **No military iconography anywhere.** No camo, dog tags, ranks, flags, silhouettes. Those *are* the triggers we are treating.
- **No "thank you for your service" framing.** No hero copy. No badge-of-honor visual language.
- **Privacy is foreground, not buried in settings.** Mental-health stigma in military culture is real and load-bearing on adoption.
- **Crisis access is one tap from every screen.** Quiet, not alarming.
- **Treats the user as capable.** Never fragile, never patronizing.

## The core loop (a session)

1. User opens app. App shows today's prepared walk (scene + selected sounds).
2. User taps **begin**. Ambient soundscape plays through headphones (river, city, etc.).
3. A pre-recorded voice narrates the scene in soft, second-person prose.
4. After ~60–90 seconds, a user-consented trigger sound enters the soundscape (motorcycle, helicopter, etc.).
5. **Two control layers run in parallel:**
   - **Manual** — the user can drag an always-visible *softer / louder* slider on the session screen at any time. Slider sets a ceiling on trigger volume.
   - **Automatic** — Apple Watch streams pulse to the app. If pulse crosses threshold, voice softens to a calming script, breathing circle slows, trigger sound auto-attenuates below the user's ceiling. No popup, no alert.
6. Session ends after ~6 minutes. User sees pulse curve and a three-option check-in.

## The demo

**The hero moment of the pitch is the absence of drama on screen** while the soundscape and pulse loop work underneath. Judges see a quiet phone. They hear an intense soundscape. The pulse number rises. The voice changes. The visual stays calm. That contrast is the story.

**Demo flow** (target: ~3 minutes on stage):

1. Welcome → Permissions → Setup (scene + sounds) → Home — about 45 seconds, sells the consent moment.
2. Begin session. Ambient plays. Voice narrates. ~30 seconds of calm.
3. Trigger sound enters. The presenter drags the intensity slider down a notch — *the user is always in control*. ~15 seconds.
4. Trigger comes again, pulse climbs anyway. Voice script shifts. Breathing slows. App auto-responds without the user touching the phone. ~45 seconds. **This is the moment.**
5. After-session screen: pulse sparkline, three-option reflection.

The two beats — *manual softening* then *automatic softening* — narrate the two-layer design without anyone having to explain it. The pitch deck can stay quiet while the app speaks.

## Brand

Wordmark is **English-only** in both EN and HE interfaces. It is a logo, not a translated string.

```
     h e a r ◯           the O is the breathing circle from the
                         session screen. logo and central interaction
                         share the same shape.
```

The wordmark reads as **hear + O**, not Hero. The O is graphically the breathing circle. We deliberately avoid any reading that lands on "hero" because of the persona's relationship to that word (see persona constraints).

## Words we use / don't

Applies to every surface — screen copy, notifications, marketing, pitch deck.

```
                       use                    do not use
session             →  "today's walk"      ✗  "treatment"
trigger sound       →  (do not name it)    ✗  "trigger"
exposure            →  "practice"          ✗  "therapy"
heart rate          →  "your pulse"        ✗  "biometrics"
condition           →  (never mention)     ✗  "PTSD", "disorder"
the user            →  "you"               ✗  "the patient", "user"
```

## Crisis access

A *need someone to talk to right now?* sheet is reachable from every screen via a small **i** glyph. The `i` reads as info/accessibility, not alarm — alarming UI in a crisis moment is itself activating. The sheet headline does not use the words *crisis*, *panic*, *emergency*, or *help* — the user knows why they tapped.

Primary action: **call ERAN 1201** (ער"ן — Israel's free, 24/7, anonymous emotional first-aid hotline). Secondary action: a *person you trust* shortcut into the user's nominated contacts.

Visual layout in [FRONTEND.md](./FRONTEND.md#crisis-sheet).

## Languages

- Locale detected at launch. Hebrew device → Hebrew UI + RTL layout. Otherwise English.
- Fallback for non-EN/non-HE devices: **Hebrew** (the demo audience is Israeli).
- Wordmark stays English in both — it is a logo, not text.

Technical implementation (i18n, RTL, fonts) lives in [FRONTEND.md](./FRONTEND.md#bilingual--rtl).

## Scope: what frontend owns

Frontend owns everything the user sees and touches: the six screens, the design system, the audio playback orchestration, the pulse-driven voice/breathing response logic, the i18n setup, the HealthKit hook for live pulse, a mocked pulse generator for demoing without a watch present.

Frontend does *not* own: user accounts, persistence beyond device, any server-side AI, the Apple Watch companion app (if any). Those belong to the backend team. The frontend can demo end-to-end without any of them — pulse is mocked when no watch is paired, voice lines are pre-recorded clips, scene/sound state is local.

## Assets needed

To go from scaffold to demo-ready, these need to be produced (out of frontend scope to create, in scope to integrate):

```
sounds/
  ambient/
    river-path.mp3        ~6 min loop
    city-evening.mp3      ~6 min loop
    cafe-morning.mp3      ~6 min loop
    quiet-road.mp3        ~6 min loop
  triggers/
    motorcycle.mp3        ~3-5 sec
    helicopter.mp3        ~3-5 sec
    fireworks.mp3         ~3-5 sec
    siren.mp3             ~3-5 sec
    car-backfire.mp3      ~3-5 sec
    shouting.mp3          ~3-5 sec
voice/
  en/                     pre-recorded English narration lines,
                          ~12-15 lines per scene, two scripts
                          per scene (calm + post-trigger calming)
  he/                     same, in Hebrew
```

Until real assets land, screens use silence stubs so the app runs end-to-end.

## Open questions

- **Wordmark final form.** Direction is *hear + O* with O = breathing circle. Final graphic file needs to be locked before any pixel-level brand work.
- **Watch companion app.** Out of frontend scope for this hackathon. Watch acts as a sensor only, no UI on the wrist.
- **AI voice generation pipeline.** If we want voice lines generated rather than human-recorded, that's a backend decision (ElevenLabs, Hume, etc.) — current spec assumes pre-recorded human or pre-generated clips.

## What's intentionally out of scope for the hackathon

- Onboarding longer than 3 screens
- Streaks, achievements, gamification
- Social/sharing features
- Multi-device sync
- A clinician-facing dashboard
- Push notifications beyond the daily reminder
- A real account system (single local profile for the demo)
