# HearO — Frontend spec

Design system, screen specs, and implementation notes for the mobile app.

> For product framing, persona, brand reading, scope, and assets needed, see [README.md](./README.md).

## Design language

### Palette

```
bg          #241B16    warm cocoa-black — primary surface
bg-elev     #2F231C    cards, sheets
bg-deep     #1A1310    deepest tone — used at the bottom of scene
                       overlays to anchor the foreground
text        #EFE7DC    primary
text-mute   #9A8E7F    secondary
accent      #D89060    warm copper — actions, pulse, focus
accent-soft #A26A40    same hue, darker — granted/disabled states
critical    #B23A3A    crisis sheet only (never trigger sounds)
```

The palette is intentionally warm-leaning. Pure black reads as cold and clinical — the wrong feeling for an app a veteran opens at 2 a.m. The cocoa-black bg has just enough red-orange in the hex to feel held, not sterile, while staying dark enough that a scene image laid on top still reads as evening.

### Scene backgrounds

Session screens are *cinematic with restraint*: a scene image (river, park, cafe, road) sits behind the foreground, covered by a warm-dark gradient overlay strong enough that the imagery reads as mood, not as a photograph. The journal tone holds; the scene tells you *where* in a glance, the voice and breathing circle stay quiet on top.

```
Image (cover)
└── LinearGradient (top → middle → bottom)
    top      tokens.bg     @ 0.82 alpha
    middle   tokens.bg     @ 0.78 alpha
    bottom   tokens.bgDeep @ 0.86 alpha

During an auto-soften phase, overlay intensity bumps by ~0.08
to match the quieter foreground state.
```

Scenes available as `SceneKey`: `river`, `park`, `cafe`, `road`. Each has a scene-tint gradient (the color hint behind the imagery — green for park, cool teal for river, amber for cafe, dusty tan for road) so even if the network image fails to load, the screen still reads as the right *place*.

The Welcome, Permissions, Setup, Home, and After screens use the flat `bg` color, not scene imagery. Only the Session screen is cinematic — the others are notebook pages.

### Type

```
Display    Frank Ruhl Libre, 28/36
           used for the voice's spoken lines, headings,
           and any moment that should carry weight.
           Free on Google Fonts. Renders beautifully in Hebrew.

Body       Heebo, 17/24
           humanist sans, designed as the Hebrew counterpart
           to Roboto. Pairs naturally with Frank Ruhl Libre.
           Free on Google Fonts.
```

Single family pair across both languages. No serif/sans split between EN and HE — that would break visual coherence.

### Motion

```
default      600ms ease-out
scene xfade  4–7s between session phases
trigger      barely perceptible — single 200ms accent flash
             on the breathing circle. deliberately undramatic.
breathing    4s in, 6s out (slow exhale longer than inhale)
```

## Screen flow

Six screens in the demo path. Settings/profile is post-demo polish.

```
1. Welcome           single sentence + start
2. Permissions       HealthKit + notifications, privacy-framed
3. Setup             scene picker + consented sound list
4. Home              today's walk, ready when you are
5. Session   ★HERO   ambient → voice → trigger → pulse loop
6. After             pulse sparkline + three-option reflection
```

### 1. Welcome

```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│   ─                     │
│                         │
│   a quiet place         │   serif, large
│   to walk again.        │
│                         │
│                         │
│                         │
│   begin  →              │   accent, no button chrome
│                         │
└─────────────────────────┘
```

Hebrew: *מקום שקט ללכת בו שוב.* / *התחל*

### 2. Permissions

```
┌─────────────────────────┐
│                         │
│  ─                      │
│                         │
│  two things this app    │
│  will need.             │
│                         │
│  your pulse             │
│  so it knows when to    │
│  slow down for you.     │
│                         │
│  [ allow apple health ] │
│                         │
│  reminders              │
│  to be here when you    │
│  said you would.        │
│                         │
│  [ allow ]              │
│                         │
│  nothing leaves your    │
│  phone unless you ask.  │
│                         │
└─────────────────────────┘
```

The last line is load-bearing. Make it true: no analytics that ping home without consent.

### 3. Setup

```
┌─────────────────────────┐
│  ←                      │
│                         │
│  where would you        │
│  like to walk?          │
│                         │
│  ●  river path          │
│  ○  city, evening       │
│  ○  cafe, morning       │
│  ○  quiet road          │
│                         │
│  ─                      │
│                         │
│  which sounds are       │
│  you ready to hear?     │
│                         │
│  pick what feels true.  │
│  you can change this    │
│  anytime.               │
│                         │
│  ☐  car backfire        │
│  ☑  motorcycle          │
│  ☐  helicopter          │
│  ☐  fireworks           │
│  ☐  siren               │
│  ☐  shouting            │
│                         │
│  ready  →               │
│                         │
└─────────────────────────┘
```

Two distinct sections by design. Picking a scene is a *place* decision. Picking sounds is a *consent* decision. They must not blur.

### 4. Home

```
┌─────────────────────────┐
│  i              ≡       │   crisis (i), settings (≡)
│                         │
│  ─                      │
│                         │
│  good evening,          │
│  shai.                  │
│                         │
│  today's walk           │
│                         │
│  river path             │
│  with motorcycle        │
│                         │
│  about six minutes      │
│                         │
│  [      begin       ]   │
│                         │
│  change what's planned  │
│                         │
└─────────────────────────┘
```

Note: "about six minutes" not "6:00". Duration is approximate, not a stopwatch — the journal tone rejects precision in non-pulse contexts.

### 5. Session (hero)

```
┌─────────────────────────┐
│  i                    × │
│                         │
│  river walk, evening    │
│                         │
│                         │
│   you're walking        │   voice line, serif,
│   along the river.      │   fades in/out as voice
│   the air is cool.      │   speaks. one line at a time.
│                         │
│          ◯              │   breathing circle
│        ◯   ◯            │   4s in / 6s out
│          ◯              │
│                         │
│                         │
│  softer  ────●────  louder  │   intensity (trigger volume)
│                         │
│  ──────────── 2:14      │
│                         │
│  pulse 78    [ pause ]  │
│                         │
└─────────────────────────┘
```

**Trigger-sound behavior:**

1. Ambient stays at full volume. No visual warning. No countdown.
2. Trigger sound plays at the user's current intensity setting.
3. Breathing circle does one barely-perceptible accent pulse.
4. Voice continues with a calmer script.
5. If pulse > threshold: voice softens further, breathing slows, trigger auto-attenuates below the user's set ceiling. No popup. No alert.

**Intensity control (the slider):**

- Always visible during the session, drag-to-adjust.
- Controls *trigger sound volume only* — ambient soundscape and voice are unaffected.
- The slider position is a **ceiling**, not a fixed level. Automatic pulse-driven response can still drop trigger volume below the user's setting, then return to the ceiling when the pulse normalizes. The two layers never fight: both can only make things softer.
- The level the user lands on at session end becomes the default starting ceiling next time. If a veteran spent today's motorcycle session near *softer*, the app does not assume they are ready for full volume tomorrow.
- No numeric labels, no percentages, no "level 3 of 5". The slider is felt, not read.
- Implementation note: the slider's gesture handler must interrupt any in-flight automatic attenuation animation cleanly. If the user grabs the slider mid-spike-response, the auto-animation must not overwrite their input. Use Reanimated shared values.

### 6. After

```
┌─────────────────────────┐
│                         │
│  ─                      │
│                         │
│  you were here          │
│  for six minutes.       │
│                         │
│  your pulse             │
│                         │
│  ▁▂▃▆▇▅▃▂▁              │
│  72   ··   108   ··  74 │
│                         │
│  ─                      │
│                         │
│  how was that?          │
│                         │
│  ○  still here          │
│  ○  shaken              │
│  ○  steady              │
│                         │
│  done                   │
│                         │
└─────────────────────────┘
```

Three options, deliberately not a 1–5 scale and not good/bad. *Still here* goes first — it's the most honest option for someone who just got through something hard.

## Crisis sheet

Reachable via the **i** glyph on every screen.

```
┌─────────────────────────┐
│  ╭─────────────────╮    │
│  │  need someone   │    │
│  │  to talk to     │    │
│  │  right now?     │    │
│  │                 │    │
│  │  call ERAN      │    │   large, accent
│  │  1201           │    │
│  │                 │    │
│  │  free, 24/7,    │    │
│  │  anonymous.     │    │
│  │                 │    │
│  │  a person you   │    │
│  │  trust   >      │    │
│  │                 │    │
│  │  close          │    │
│  ╰─────────────────╯    │
└─────────────────────────┘
```

Sheet style: `bg-elev`, rounded, no scrim flash. Slides in from bottom at default 600ms ease-out. The phone number is the primary tappable — `tel:1201` URI.

## Bilingual & RTL

- Locale detected at launch via `expo-localization`. Hebrew device → Hebrew UI + RTL layout. Otherwise English.
- Fallback for non-EN/non-HE devices: **Hebrew** (the demo audience is Israeli).
- All copy in `lib/i18n.ts` with `en` and `he` keys.
- Layout mirroring via React Native's `I18nManager.forceRTL` + NativeWind `rtl:` variants. Every margin/arrow/alignment flips automatically.
- Wordmark is the one exception. It stays left-anchored in both layouts because it's a logo, not text.

## Frontend stack

```
Runtime              Expo (managed workflow)
Language             TypeScript
Styling              NativeWind (Tailwind classes for React Native)
Navigation           Expo Router (file-based)
State                Zustand
Fonts                @expo-google-fonts/frank-ruhl-libre,
                     @expo-google-fonts/heebo
Audio                expo-av
Health data          react-native-health (HealthKit)
i18n                 i18next + react-i18next
Animation            react-native-reanimated
Localization         expo-localization
```

No Redux, no Storybook, no design-system library. Hackathon constraints. Copy-paste components, not black-box ones.

## Project structure

```
app/                  Expo Router screens
  index.tsx           welcome
  permissions.tsx
  setup.tsx
  home.tsx
  session.tsx         the hero
  after.tsx
  _layout.tsx         font loading, i18n init, RTL setup
components/
  BreathingCircle.tsx
  PulseTicker.tsx
  VoiceLine.tsx       fades serif lines in/out
  IntensitySlider.tsx softer / louder, with ceiling semantics
  CrisisSheet.tsx
lib/
  i18n.ts             en + he strings
  audio.ts            preloaded clip player
  pulse.ts            mocked HR generator (for demo) +
                      HealthKit hook (for real watch)
  tokens.ts           palette + spacing exported for use in TS
assets/
  sounds/             ambient + trigger clips
  voice/              pre-recorded TTS lines (en + he)
  fonts/              Frank Ruhl Libre, Heebo
tailwind.config.js    palette + font families
```
