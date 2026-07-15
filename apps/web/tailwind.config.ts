import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./lib/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      // Astraya 星脉 palette: deep night + starlight gold + amethyst
      colors: {
        night: {
          900: "#05071A",
          800: "#0A0E27",
          700: "#121736",
          600: "#1A2047",
          500: "#242C59",
          400: "#3A447A",
        },
        starlight: {
          400: "#F3D98E",
          500: "#E8C37A", // primary gold
          600: "#D4AF37",
          700: "#A88428",
        },
        amethyst: {
          300: "#D2B8F0",
          400: "#B88EE2",
          500: "#9D6FD9", // primary amethyst
          600: "#7B4FB8",
          700: "#5B3790",
        },
        pearl: {
          100: "#F7F5ED",
          200: "#F0EEE6",
          300: "#D6D3C4",
          400: "#A8A598",
        },
        ink: {
          900: "#03050F",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Noto Serif SC", "Cormorant Garamond", "serif"],
        sans: ["var(--font-sans)", "Inter", "Noto Sans SC", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "starfield":
          "radial-gradient(ellipse at top, rgba(157,111,217,0.15) 0%, transparent 45%), radial-gradient(ellipse at bottom, rgba(232,195,122,0.08) 0%, transparent 50%), linear-gradient(180deg, #05071A 0%, #0A0E27 100%)",
        "meridian": "linear-gradient(135deg, rgba(232,195,122,0.15) 0%, rgba(157,111,217,0.15) 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(232,195,122,0.35)",
        "glow-amethyst": "0 0 40px -10px rgba(157,111,217,0.4)",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
        drift: {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        twinkle: "twinkle 3s ease-in-out infinite",
        drift: "drift 2.5s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};

export default config;
