/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#241B16",
        "bg-elev": "#2F231C",
        "bg-deep": "#1A1310",
        text: "#EFE7DC",
        "text-mute": "#9A8E7F",
        accent: "#D89060",
        "accent-soft": "#A26A40",
        critical: "#B23A3A",
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
