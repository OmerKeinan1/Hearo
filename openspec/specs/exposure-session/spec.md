# exposure-session

## Purpose

The core therapeutic loop of HearO. A user puts on headphones, taps **begin**, and is taken through a guided walk: an ambient soundscape, a voice narrating the scene, and after a calm opening period, a user-consented trigger sound layered into the ambient mix. The session monitors the user's pulse and the user's manual intensity setting throughout, and ends with a brief reflection.

## Requirements

### Requirement: Consent-bound trigger sounds
The session MUST only play trigger sounds the user has previously consented to during setup. The session MUST NOT introduce a sound the user has not added to their consented list.

#### Scenario: Sound is consented
- GIVEN the user has `motorcycle` in their consented sounds list
- WHEN the session enters the during phase
- THEN the motorcycle trigger sound plays layered over the ambient soundscape

#### Scenario: Empty consent list
- GIVEN the user's consented sounds list is empty
- WHEN the session runs through opening, during, and calming phases
- THEN no trigger sound is played at any point
- AND ambient and voice continue uninterrupted, giving the user a rehearsal walk without exposure

### Requirement: Three named phases
The session MUST progress through three named phases in order: opening (calm ambient + introductory voice), during (trigger sound enters), calming (voice script that explicitly acknowledges the trigger and re-grounds the user).

#### Scenario: Phase progression on time
- GIVEN a session that has just started
- WHEN 15 seconds have elapsed
- THEN the session enters the during phase
- AND the during voice script begins playing

### Requirement: No visible warning before triggers
The session MUST NOT display a popup, banner, countdown, or visible warning before a trigger sound plays. The only acceptable visual response to the trigger is a barely-perceptible accent flash on the breathing circle.

#### Scenario: Trigger arrives without warning
- GIVEN the session is in the opening phase
- WHEN the during phase begins and the trigger sound plays
- THEN no popup, banner, or alert appears on screen
- AND the breathing circle does a single 200ms accent flash that fades over 1200ms

### Requirement: Voice captions in display serif
Every spoken voice line MUST appear on screen as a caption in the display serif font, one line at a time, with fade-in and fade-out transitions.

#### Scenario: Voice line transition
- GIVEN the session is playing the opening voice line
- WHEN the voice transitions to the during script
- THEN the previous caption fades out
- AND the new caption fades in within 900ms

### Requirement: Breathing circle slows during calming
The breathing circle MUST animate at 4s inhale / 6s exhale during opening and during phases, and MUST slow to 5s inhale / 8s exhale during the calming phase.

#### Scenario: Pulse spike triggers slower breathing
- GIVEN the session is in the during phase with breathing at 4s/6s
- WHEN the user's pulse crosses the calming threshold
- THEN the breathing circle transitions to a 5s/8s cycle
- AND the voice transitions to the calming script

### Requirement: Continuous pulse display
The session MUST display the user's current pulse continuously, sourced from Apple Watch via HealthKit when available, and from the mocked pulse generator otherwise.

#### Scenario: Watch present
- GIVEN the user has an Apple Watch paired and HealthKit permission granted
- WHEN the session is running
- THEN the displayed pulse value reflects HealthKit's live heart rate

#### Scenario: No watch present
- GIVEN no watch is paired
- WHEN the session is running
- THEN the displayed pulse value comes from the mocked pulse generator following the phase-aware curve

### Requirement: Elapsed time only, no countdown
The session MUST display elapsed time as `m:ss` near the bottom of the screen. The session MUST NOT show a countdown timer or progress toward a target duration.

#### Scenario: Time display
- GIVEN the session has been running for 134 seconds
- WHEN the session screen is observed
- THEN the time indicator shows `2:14`
- AND no countdown, progress bar toward completion, or remaining-time value is shown

### Requirement: Early exit routes to After
The session MUST be exitable at any time via the × icon. Exiting MUST route the user to the After screen, not back to Home.

#### Scenario: User taps × mid-session
- GIVEN the session is in any phase
- WHEN the user taps the × icon
- THEN audio fades to silence over 600ms
- AND the user lands on the After screen with the pulse curve so far and reflection options
- AND the partial session is still recorded, not discarded

### Requirement: Crisis access from session
The session MUST surface the crisis sheet via a small `i` glyph in the top-left, reachable in one tap from any phase.

#### Scenario: Crisis tap during session
- GIVEN the session is in any phase with audio playing
- WHEN the user taps the `i` glyph
- THEN audio fades to silence over 200ms
- AND the breathing circle freezes mid-cycle
- AND the crisis sheet slides up from the bottom
- AND the session is paused, not ended
