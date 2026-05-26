export const tokens = {
  // App surface — warm sand/paper light theme (used on every screen
  // except the immersive Session screen).
  bg: "#F2EBDD",
  bgElev: "#E8DECB",
  text: "#2E2823",
  textMute: "#7A7060",
  accent: "#C17A45",
  accentSoft: "#9A6238",
  sage: "#7E9468",
  critical: "#BC6A4F",

  // Scene — the Session screen stays an immersive dark moment: light text
  // over scene imagery, with a warm-dark gradient overlay for legibility.
  sceneText: "#F4EEE3",
  sceneTextMute: "#CDBBA6",
  sceneAccent: "#E0A56B",
  sceneOverlayBottom: "#140F0C",
} as const;

export const fonts = {
  display: "FrankRuhlLibre_400Regular",
  displayMedium: "FrankRuhlLibre_500Medium",
  body: "Heebo_400Regular",
  bodyMedium: "Heebo_500Medium",
} as const;
