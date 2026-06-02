---
title: In-the-moment regulation — feature exploration and the engagement problem
tags: [clinical, product, research]
audience: everyone, clinician, product
status: exploratory
---

# In-the-moment regulation: feature exploration

A research memo exploring a novel, **on-device-only** feature for HearO (no backend, no
watch dependency), the peer-reviewed basis for it, and — critically — the behavioral
evidence on whether it would actually get used. Recorded so a later iteration inherits
both the idea and the honest objection to it.

> Status is **exploratory**. Nothing here is committed. The headline finding is that the
> first framing of the feature rested on a weak behavioral assumption, and the literature
> pushed it toward a more defensible shape. See [Revised framing](#revised-framing).

## The brief

Find the highest-value novel feature for people with PTSD, weighted toward ideas that add
**no external dependencies** (no backend, no Apple Watch), preferring directions backed by
peer-reviewed research.

## The field, and where the gap is

- **Exposure is the gold standard and HearO already implements it.** APA and VA/DoD
  guidelines put trauma-focused exposure first-line; large effect sizes (Powers et al.
  2010, Cohen's *d* ≈ 1.1). See [`RATIONALE.md`](../RATIONALE.md).
- **The veteran app landscape is dominated by VA/DoD's PTSD Coach and PE Coach** —
  *companions* (psychoeducation, symptom self-monitoring, homework reminders), not active
  in-context exposure. HearO's audio-exposure loop is already more novel than these.
- **The best-validated weakness of exposure therapy is the one HearO's own docs flag:
  durable real-world transfer.** Extinction learning is *context-dependent* — the brain
  learns "this sound is safe *here*," and when the cue reappears in a new context, fear
  **renews** (Bouton 2004). Relapse runs 30–50%. The research-supported antidote is
  extinction across **multiple contexts** (Dunsmoor et al. 2014).
- **Combat-specific caveat (rules out an obvious idea):** posttraumatic-nightmare therapy
  (Imagery Rehearsal Therapy) is fully on-device and tempting, but its strong RCT
  (Krakow et al. 2001, *JAMA*) was in *sexual-assault survivors*. The two **combat-veteran**
  RCTs (Vietnam; Iraq/Afghanistan) found **no advantage** over active comparators. Weak bet
  for HearO's audience.

## The feature (first framing): "Out Here" — a field companion

A portable, one-tap micro-session the user opens **in the real world, at the moment a real
trigger hits** (a motorcycle backfire, fireworks, a passing siren): the same trusted voice
from their walks, plus a personalized **resonance-frequency paced-breathing** regulator —
the breathing circle `◯` becomes the pacer. Afterward, a one-tap local log of *where* it
happened and *how high it got*.

Why it looked strong:

1. **Targets the validated weakness (renewal).** Practicing only in the calm app context
   produces context-bound extinction; logging/regulating across many real contexts is the
   literature's actual prescription for reducing renewal (Bouton 2004; Dunsmoor et al. 2014).
2. **The regulator is independently evidence-based and needs no sensor.** Slow paced
   breathing at ~6 breaths/min (resonance frequency) reliably lowers acute state anxiety and
   arousal (*Scientific Reports* 2025; *Frontiers in Human Neuroscience* 2025; breathwork RCT
   meta-analysis, Fincham et al. 2023) and maximizes HRV/baroreflex gain (Steffen et al.
   2017; Lehrer et al. HRVB guidelines 2023). Entrainment to a pacer *is* the intervention —
   no watch needed. This also retires HearO's "the auto-soften threshold is a guess and
   depends on the watch" open question.
3. **Maximally on-device, reuses existing primitives** (voice, breathing circle, audio
   engine, intensity model). No backend, no watch.
4. **Fits persona/brand** — one tap, no alarm, no military framing, treats the user as capable.
5. **Optional opt-in progress signal without a watch:** in field mode the phone is already in
   hand, so **fingertip camera PPG** can recover the objective-progress function the watch
   provided — smartphone fingertip PPG vs ECG r = .997 (Yan et al. 2017). Offer, never require.

## The objection that reshaped it

> *Is there empirical evidence users will actually open an app during a trigger? During a
> trigger people enter a panic mode where opening an app probably isn't on their mind.*

This is the single weakest link, and the literature **leans toward the objection.**

- **Acute arousal impairs the exact capacity the feature requires.** Panic / high
  trauma-arousal states involve attentional narrowing, body vigilance, and frequently
  depersonalization–derealization (dissociation); sufferers are often described as "unable to
  self-regulate," with benefit coming from *external* prompting or a *pre-trained* routine,
  not self-initiated multi-step problem-solving (PMC panic/dissociation; *Australian
  Psychologist* 2025; MHFA panic-attack Delphi guidelines). "Unlock → find app → navigate →
  start" is an executive-function task — precisely what's degraded at the apex.
- **JITAI compliance shows self-initiation is unreliable even when the app is trying.**
  In-the-moment adaptive interventions are the subfield built around this exact problem, and
  engagement is sobering — e.g. a gambling JITAI logged **~32%** EMA compliance. The field's
  conclusion: don't rely on the user reaching for the tool; *trigger* it. But triggering needs
  detection (always-on mic, or the watch) — which collides with the no-backend/no-watch brief.

### The one contrary data point (and its limits)

The closest direct evidence is **PTSD Coach "in the wild"** (Owen et al. 2015, *JMIR Mental
Health*): users *did* open coping tools in moments of need and momentary distress dropped a
real **1.6–2.0 points** on a 10-point thermometer (v3.1 replication: −1.38 from a starting
6.03). So in-the-moment self-help use is **not zero**. But:

- Starting distress ~6/10 is **elevated, not peak panic** — consistent with use during the
  *recovery tail* or anticipatory worry, not the apex.
- Attrition is brutal: **~10.6%** still using at one year.
- These were already-motivated self-help adopters — a selected group.

## Revised framing

Don't target the peak. The more defensible feature is **"before & after," habit-cued**, not
"during":

1. **Anticipatory use** — fire it *before* a known exposure (heading into a crowd, a fireworks
   night). PTSD avoidance is anticipatory, so this window is real and executive function is
   intact.
2. **The recovery tail** — the "coming down but still activated / ruminating" window, which is
   where the PTSD Coach data actually shows usage and benefit.
3. **Activation cost → near-zero** — voice-first, no reading, no menus; a single lock-screen
   widget / one large button, so it survives narrowed attention. MHFA panic guidance agrees:
   simple, *pre-rehearsed* grounding/breathing.
4. **Make the routine procedural, not deliberative** — this is the real argument *for* the
   daily walks: rehearsal turns the breathing response into something that can fire under
   stress without executive deliberation. The field tool becomes a *cue to a habit*, not a new
   task.

### Cleaner fallback / pivot

If even the reframed in-context piece feels too dependent on user initiative, the lowest-risk
high-value option is to ship the **on-device resonance-frequency breathing regulator inside
the existing seated session** — replacing the Apple Watch dependency in the automatic calming
layer with a sensor-free, evidence-based paced-breathing loop. The user is already engaged, so
initiation is not in question, and it directly retires a documented open issue.

## GOAP sketch (revised feature)

```
Goal:        On-device "before & after" regulation companion: anticipatory + recovery-tail
             resonance-paced breathing + familiar voice + local context log. No watch, no
             backend. Routine rehearsed in daily walks so it fires as a habit.

Plan Cost:   Medium. Reuses ~70% of existing session primitives.

Steps:
  1. Resonance-frequency calibration (one-time, ~2 min) — store per-user RF (4.5–7 bpm) local. [S]
  2. Repackage session loop as a 60–90s micro-session (no ambient required, foreground-fast). [M]
  3. Lowest-cost entry: lock-screen widget / one large button / voice-first, no menus.        [M]
  4. Anticipatory + recovery-tail entry points (not "detect the peak").                        [S]
  5. Local-only context log (sound + coarse user-named place + peak intensity).                [S]
  6. Cross-context progress view ("this sound, flatter, across N places") = renewal antidote.  [M]
  7. (Optional, opt-in, flagged) fingertip camera PPG for objective arousal read.              [M]

Risk Factors:
  - Self-initiation at high arousal is unreliable (the core finding above) → target before/after,
    not the apex; lean on rehearsed habit + near-zero activation cost.
  - Place-tag privacy: coarse, on-device, user-named ("the bus stop"); never GPS, never uploaded.
  - Scope creep into camera PPG: breathing pacer must stand alone with zero sensors.

Fallback: ship the resonance-breathing regulator inside the seated session (replaces watch).
```

## Open questions for a future iteration

- Does anticipatory + recovery-tail use produce measurable cross-context tolerance gains?
  (The renewal hypothesis predicts yes; untested for HearO.)
- What's the right rehearsal dose in the daily walk to make the breathing routine procedural
  enough to fire under stress?
- Does removing the watch from the regulation loop cost anything clinically, or is paced
  breathing a strict on-device win?

## Sources

**Exposure mechanism & real-world transfer**
- Bouton, M. E. (2004). *Context and behavioral processes in extinction.* Learning & Memory,
  11, 485–494. https://www.researchgate.net/publication/8249951
- *Extinction, generalization, and return of fear: A critical review of renewal research in
  humans.* Neuroscience & Biobehavioral Reviews.
  https://www.sciencedirect.com/science/article/abs/pii/S0301051112000075
- Dunsmoor et al. (2014). *Extinction in multiple virtual reality contexts diminishes fear
  reinstatement in humans.* Neurobiology of Learning and Memory.
  https://pmc.ncbi.nlm.nih.gov/articles/PMC4053498
- Powers et al. (2010); Foa & Kozak (1986) — see [`RATIONALE.md`](../RATIONALE.md).

**Slow / resonance-frequency breathing**
- *The effect of slow breathing in regulating anxiety* (2025). Scientific Reports.
  https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11897343/
- *Slow-paced breathing reduces anxiety and enhances midfrontal alpha asymmetry…* (2025).
  Frontiers in Human Neuroscience. https://pmc.ncbi.nlm.nih.gov/articles/PMC12301348/
- Steffen et al. (2017). *The Impact of Resonance Frequency Breathing on HRV, Blood Pressure,
  and Mood.* Frontiers in Public Health. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5575449/
- Lehrer et al. (2023). *Methods for Heart Rate Variability Biofeedback (HRVB): A Systematic
  Review and Guidelines.* https://pmc.ncbi.nlm.nih.gov/articles/PMC10412682/

**On-device pulse sensing (watch alternative)**
- Yan et al. (2017). *Resting and Postexercise Heart Rate Detection From Fingertip and Facial
  Photoplethysmography Using a Smartphone Camera: A Validation Study.* JMIR mHealth and uHealth.
  https://mhealth.jmir.org/2017/3/e33/

**The engagement / will-they-use-it question**
- Owen et al. (2015). *mHealth in the Wild: Using Novel Data to Examine the Reach, Use, and
  Impact of PTSD Coach.* JMIR Mental Health. https://pmc.ncbi.nlm.nih.gov/articles/PMC4607374/
- *PTSD Coach Version 3.1: A Closer Look at the Reach, Use, and Potential Impact.*
  https://pmc.ncbi.nlm.nih.gov/articles/PMC9006138/
- *Longitudinal follow-up of the RCT of the PTSD Coach self-management app.*
  https://pmc.ncbi.nlm.nih.gov/articles/PMC10235424/
- *GamblingLess: In-The-Moment* — JITAI engagement evaluation (~32% EMA compliance).
  https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12522354/

**Acute panic / dissociation / help-seeking**
- *Unraveling the Complexity: Panic Disorder, Dissociation, and Complex PTSD.*
  https://pmc.ncbi.nlm.nih.gov/articles/PMC10968653/
- *Dissociative experiences and health anxiety in panic disorder.*
  https://pmc.ncbi.nlm.nih.gov/articles/PMC8106434/
- *Exploring the complex relationship between anxiety and dissociation in a clinical
  population* (2025). Australian Psychologist.
  https://www.tandfonline.com/doi/full/10.1080/00050067.2025.2567676
- *Mental health first aid guidelines for supporting someone experiencing a panic attack: a
  Delphi study.* https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9145494/

**Nightmare therapy (combat-veteran caveat)**
- Krakow et al. (2001). *Imagery Rehearsal Therapy for Chronic Nightmares in Sexual Assault
  Survivors With PTSD: An RCT.* JAMA. https://jamanetwork.com/journals/jama/fullarticle/194063
- *RCT of Imagery Rehearsal for Posttraumatic Nightmares in Combat Veterans* (null vs active
  comparator). https://pmc.ncbi.nlm.nih.gov/articles/PMC6510682/
</content>
</invoke>
