/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#F2EBDD",
        "bg-elev": "#E8DECB",
        text: "#2E2823",
        "text-mute": "#7A7060",
        accent: "#C17A45",
        "accent-soft": "#9A6238",
        sage: "#7E9468",
        critical: "#BC6A4F",
        "scene-text": "#F4EEE3",
        "scene-text-mute": "#CDBBA6",
        "scene-accent": "#E0A56B",
      },
      fontFamily: {
        display: ["FrankRuhlLibre_400Regular"],
        "display-medium": ["FrankRuhlLibre_500Medium"],
        body: ["Heebo_400Regular"],
        "body-medium": ["Heebo_500Medium"],
      },
    },
  },
  plugins: [],
};
