import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Design tokens live here and in src/styles/tokens.css.
 * Palette rationale:
 *  - "paper" is a cool neutral ground so white cards read as raised, not flat.
 *  - jade is the primary action/calorie colour (deliberately not the default indigo).
 *  - protein / carbs / fat each own a fixed hue so macro rings are learnable at a glance.
 *  - step colours mirror the cut ladder: each calorie tier has its own tone.
 */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "hsl(var(--paper))",
        surface: "hsl(var(--surface))",
        sunken: "hsl(var(--sunken))",
        ink: "hsl(var(--ink))",
        muted: "hsl(var(--muted))",
        faint: "hsl(var(--faint))",
        line: "hsl(var(--line))",
        jade: { DEFAULT: "hsl(var(--jade))", soft: "hsl(var(--jade-soft))" },
        protein: "hsl(var(--protein))",
        carbs: "hsl(var(--carbs))",
        fat: "hsl(var(--fat))",
        cardio: "hsl(var(--cardio))",
        progress: "hsl(var(--progress))",
        plateau: "hsl(var(--plateau))",
      },
      fontFamily: {
        display: ["'Bricolage Grotesque'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "20px",
        "3xl": "26px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(12,17,22,0.04), 0 8px 24px -12px rgba(12,17,22,0.12)",
        lift: "0 2px 4px rgba(12,17,22,0.05), 0 16px 40px -16px rgba(12,17,22,0.20)",
        inset: "inset 0 1px 0 rgba(255,255,255,0.6)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up 240ms cubic-bezier(.22,1,.36,1) both" },
    },
  },
  plugins: [animate],
} satisfies Config;
