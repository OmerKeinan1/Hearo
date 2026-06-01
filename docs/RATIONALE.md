---
title: Why HearO — clinical and design rationale
tags: [clinical, product, persona, research]
audience: everyone, clinician
status: stable
---

# Why HearO

The clinical and design reasoning behind the product. Plain language, no marketing.

## What we are trying to do

Reduce the autonomic spike a combat veteran experiences when a trauma-associated sound shows up in daily life — a motorcycle backfire, a helicopter overhead, fireworks at night, a siren passing — by giving them a private, consent-based way to practice encountering those sounds in safer doses, with their heart rate watched in real time so the app can soften the encounter the moment their body says it's too much.

The goal is not to make sounds *not bother them*. The goal is to widen the window in which the sound is a sound, not a flashback trigger.

## Why exposure works

Exposure therapy is the most evidence-supported treatment for PTSD and has been for decades. The American Psychological Association's Clinical Practice Guideline ([apa.org/ptsd-guideline](https://www.apa.org/ptsd-guideline)) and the U.S. VA/DoD Clinical Practice Guideline for PTSD ([healthquality.va.gov/guidelines/MH/ptsd](https://www.healthquality.va.gov/guidelines/MH/ptsd/)) both recommend trauma-focused exposure-based therapy — Prolonged Exposure (PE), Cognitive Processing Therapy, or EMDR — as first-line treatment, ahead of pharmacotherapy.

The mechanism is **habituation through corrective re-exposure**. A traumatic experience trains the amygdala to fire a full threat response to a stimulus (the sound of a Humvee, a particular smell) even when the original danger is long gone. Exposure works by giving the brain repeated, structured experiences of the stimulus *without* the original threat outcome, until the predictive link weakens. The seminal mechanistic paper is Foa & Kozak, *Emotional Processing of Fear* (1986). Meta-analyses since — e.g. Powers et al., *A meta-analytic review of prolonged exposure for posttraumatic stress disorder* (Clinical Psychology Review, 2010) — consistently show effect sizes in the large range (Cohen's d ≈ 1.1) versus waitlist controls.

## Why audio exposure

Clinical PE alternates between *imaginal* exposure (the patient recalls the memory in detail) and *in vivo* exposure (the patient does the avoided real-world activity). Audio exposure sits between the two. It's concrete enough to provoke the autonomic response that drives habituation, safe enough to deliver through a phone, and — critically for combat trauma — many of the most disruptive triggers in civilian life *are* sounds. You can avoid a parade, but not a passing motorcycle.

A close technological cousin is VR-based exposure therapy. Rothbaum, Hodges, Ready et al. (*Virtual reality exposure therapy for Vietnam veterans with posttraumatic stress disorder*, J. Clinical Psychiatry, 2001) and subsequent VRET work (including the Bravemind / Iraq–Afghanistan veteran programs) demonstrate that ecologically engineered sensory exposure produces real PTSD symptom reduction. VR is heavier; sound is lighter. We're trading immersion for accessibility.

## Why heart-rate monitoring

Autonomic arousal — sympathetic nervous system activation — is the body's signature of a triggered fear response. Heart rate and heart rate variability are well-studied markers in PTSD populations; the elevated baseline HR and lower HRV in PTSD patients vs. controls is one of the most replicated physiological findings in the literature (e.g. Cohen, Kotler, Matar et al., *Power spectral analysis of heart rate variability in posttraumatic stress disorder patients*, Biological Psychiatry, 1997).

Apple Watch gives us a continuous, non-invasive read on this signal. We use it for three things:

1. **Confirm the exposure is doing something.** A trigger that produces no physiological response is not exposure — it's just a sound. The watch lets us see whether the session is actually engaging the system we want to retrain.
2. **Soften when arousal crosses a threshold.** Exposure works when arousal is high enough to engage the corrective learning, but if it climbs into panic territory the patient typically dissociates or shuts down, learning nothing. The app intervenes (softens the trigger, slows the voice) when pulse crosses a tolerability ceiling.
3. **Track progress objectively.** A user's self-report ("that didn't bother me as much today") is unreliable, especially for veterans. A pulse curve that's flatter for the same sound over the course of weeks is harder to dismiss.

## Why user-controlled consent (the slider)

Two reasons, one ethical and one clinical.

**Ethics.** Exposure without consent is not treatment — it's re-traumatization. The user must always be able to make the trigger softer. The manual slider on the session screen is the user's veto over the app.

**Clinical.** Real PE protocols use a Subjective Units of Distress (SUD) scale and a gradual ascent. The patient and clinician agree on how much arousal a given session targets. Forcing the exposure faster than the patient can tolerate is the single biggest driver of dropout in PE — and the dropout rate (around 20–30% in clinical samples) is the most cited critique of the therapy. Letting the user lower intensity at any time is how we let them stay in the room.

The dual-layer design (manual ceiling + automatic pulse-driven attenuation) reflects the same logic as a clinician-administered session: the user can pull back; the system also pulls back for them when their body says they can't.

## Why combat veterans, why Israel

The team is Israeli. The mandatory military service context means a very large fraction of the adult population has direct combat or operational exposure. Sound-based triggers (gunfire, sirens, helicopters, explosions) are particularly prominent in the trauma profile of this population. The dominant mental-health resource for distress in Israel is ERAN (ער"ן) at 1201 — a free, anonymous, 24/7 emotional first-aid line. The app is designed Hebrew-first; the crisis sheet calls ERAN directly.

The broader veteran-trauma audience extends well beyond Israel and beyond combat veterans (first responders, ICU staff, accident survivors), but the product's first audience is the one the team can build for honestly.

## What HearO is not

- **Not a replacement for clinical therapy.** Exposure done correctly is hard. Patients in active PE protocols see a trained clinician weekly. HearO is for between sessions, or for people not currently in care who want a structured tool, or for sub-clinical sound sensitivity.
- **Not approved by any medical regulator.** No FDA clearance, no CE mark, no AMAR registration. It's a wellness tool with a therapeutic framework, not a medical device.
- **Not for acute crisis.** The crisis sheet (one tap from every screen) exists for that. The session itself is not a crisis intervention.
- **Not diagnostic.** Nothing in the app tells the user whether they have PTSD. We don't run assessments.
- **Not surveillance.** Crisis taps are not logged. The user's pulse curve stays on device unless the user explicitly shares a session record.

## What we are not yet sure about

These are open clinical and product questions, listed so future iterations don't paper over them:

- **Long-term effect.** We have no evidence yet that in-session attenuation translates to durable tolerance gains weeks later. This needs a clinical study.
- **Threshold calibration.** The pulse threshold that triggers auto-soften is currently a guess (~105 bpm in the current build, with no personalization). The right threshold depends on baseline HR, fitness, age, medication, and tolerance window — all of which vary. A real version would learn this per user.
- **Optimal frequency and progression.** PE protocols are typically 8–15 weekly sessions. HearO's model assumes daily ~6-minute walks. We don't know if that cadence is too much, too little, or right.
- **The dropout problem.** Even if the audio modality lowers the activation barrier, the user still has to open the app and start. Engagement loops for PTSD self-help apps are notoriously fragile.

## Further reading

**Clinical practice guidelines (free, authoritative):**

- American Psychological Association — Clinical Practice Guideline for the Treatment of PTSD: [apa.org/ptsd-guideline](https://www.apa.org/ptsd-guideline)
- U.S. VA/DoD — Clinical Practice Guideline for the Management of PTSD: [healthquality.va.gov/guidelines/MH/ptsd](https://www.healthquality.va.gov/guidelines/MH/ptsd/)
- APA Division 12 — Prolonged Exposure Therapy for PTSD overview: [div12.org/treatment/prolonged-exposure-therapy-for-ptsd](https://www.div12.org/treatment/prolonged-exposure-therapy-for-ptsd/)
- VA National Center for PTSD: [ptsd.va.gov](https://www.ptsd.va.gov/)
- NIMH — PTSD overview: [nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd](https://www.nimh.nih.gov/health/topics/post-traumatic-stress-disorder-ptsd)

**Foundational and meta-analytic papers (titles for lookup):**

- Foa, E. B., & Kozak, M. J. (1986). *Emotional processing of fear: Exposure to corrective information.* Psychological Bulletin, 99(1), 20–35.
- Powers, M. B., Halpern, J. M., Ferenschak, M. P., Gillihan, S. J., & Foa, E. B. (2010). *A meta-analytic review of prolonged exposure for posttraumatic stress disorder.* Clinical Psychology Review, 30(6), 635–641.
- Rauch, S. A. M., Eftekhari, A., & Ruzek, J. I. (2012). *Review of exposure therapy: A gold standard for PTSD treatment.* Journal of Rehabilitation Research and Development, 49(5), 679–688.
- Rothbaum, B. O., Hodges, L. F., Ready, D., Graap, K., & Alarcon, R. D. (2001). *Virtual reality exposure therapy for Vietnam veterans with posttraumatic stress disorder.* Journal of Clinical Psychiatry, 62(8), 617–622.
- Cohen, H., Kotler, M., Matar, M. A., Kaplan, Z., Miodownik, H., & Cassuto, Y. (1997). *Power spectral analysis of heart rate variability in posttraumatic stress disorder patients.* Biological Psychiatry, 41(5), 627–629.

For the crisis line referenced in-app: **ERAN (ער"ן) 1201** — Israel's free, 24/7, anonymous emotional first-aid hotline: [eran.org.il](https://www.eran.org.il/).
