/**
 * Seed data for a new phase, transcribed from the user's written plan.
 *
 * IMPORTANT: this is a *seed*. Once written to Supabase the rows are the source
 * of truth and every value is editable in the app. Nothing here is read at
 * runtime after the first sync.
 *
 * Where the source document gave kcal and protein but not carbs/fat, the
 * remaining macros were back-filled from the food's typical composition so the
 * macro rings have something honest to show. Edit any line in the app.
 */

export const PHASE_DEFAULTS = {
  name: "Recomp",
  goal: "recomp" as const,
  startDate: "2026-08-05",
  durationWeeks: 16,
  maintenanceKcal: 2675,
  baseKcal: 2400,
  proteinTargetG: 130,
  carbsTargetG: 168,
  fatTargetG: 100,
  plateauThresholdKg: 0.15,
  minHoldDays: 14,
  graceWeeks: 2,
  stepKcal: 100,
  cardioCeilingKcal: 300,
  kcalFloor: 2100,
};

export interface SeedItem {
  name: string;
  portion?: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface SeedMeal {
  name: string;
  time_label: string;
  items: SeedItem[];
}

const CHIA: SeedItem = {
  name: "Chia seeds, soaked",
  portion: "8 g — soak 10 min before eating",
  kcal: 40, protein_g: 1.3, carbs_g: 3.4, fat_g: 2.5,
};

export const SEED_MEALS: SeedMeal[] = [
  {
    name: "Breakfast",
    time_label: "8:30 AM",
    items: [
      CHIA,
      { name: "Country Delight 2X Protein Milk", portion: "450 ml", kcal: 270, protein_g: 25, carbs_g: 22, fat_g: 9 },
      { name: "CD 2X Protein Wheat Bread", portion: "4 slices", kcal: 332, protein_g: 25, carbs_g: 48, fat_g: 4.5 },
    ],
  },
  {
    name: "Lunch",
    time_label: "1:00 PM",
    items: [
      CHIA,
      { name: "Whole eggs", portion: "2", kcal: 144, protein_g: 12, carbs_g: 1, fat_g: 10 },
      { name: "CD 2X Protein Wheat Bread", portion: "2 slices", kcal: 166, protein_g: 12, carbs_g: 24, fat_g: 2.2 },
      { name: "CD 2X Protein Idli Dosa Batter", portion: "112 g, cooked as dosa", kcal: 170, protein_g: 12, carbs_g: 26, fat_g: 1.5 },
      { name: "Cooking fat", portion: "~4.5 tsp oil / butter", kcal: 180, protein_g: 0, carbs_g: 0, fat_g: 20 },
    ],
  },
  {
    name: "Pre-workout",
    time_label: "5:30 PM",
    items: [
      { name: "Banana", portion: "1 medium", kcal: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4 },
      { name: "Roasted chana", portion: "~25 g", kcal: 100, protein_g: 6, carbs_g: 10.5, fat_g: 1.5 },
    ],
  },
  {
    name: "Post-workout",
    time_label: "8:00 PM",
    items: [
      { name: "MyFitFuel Whey — Masala Milk", portion: "1 scoop (33 g)", kcal: 120, protein_g: 24, carbs_g: 1.5, fat_g: 1.5 },
      { name: "Roasted chana", portion: "~25 g", kcal: 100, protein_g: 6, carbs_g: 10.5, fat_g: 1.5 },
    ],
  },
  {
    name: "Dinner",
    time_label: "9:00 PM",
    items: [
      CHIA,
      { name: "Whole eggs", portion: "3", kcal: 216, protein_g: 18, carbs_g: 1.5, fat_g: 15 },
      { name: "CD 2X Protein Wheat Bread", portion: "2 slices", kcal: 166, protein_g: 12, carbs_g: 24, fat_g: 2.2 },
      { name: "CD 2X Protein Idli Dosa Batter", portion: "112 g, cooked as dosa", kcal: 170, protein_g: 12, carbs_g: 26, fat_g: 1.5 },
      { name: "Cooking fat", portion: "~4.5 tsp oil / butter", kcal: 180, protein_g: 0, carbs_g: 0, fat_g: 20 },
    ],
  },
];

// ---------------------------------------------------------------------------
// The step ladder. Alternating diet cut → cardio add, one rung at a time,
// triggered only by a confirmed plateau.
// ---------------------------------------------------------------------------

export interface LadderRung {
  index: number;
  kcal: number;
  cardioKcal: number;
  kind: "baseline" | "diet" | "cardio";
  label: string;
  /** what actually changes, in the user's own vocabulary */
  detail: string;
}

export const LADDER: LadderRung[] = [
  { index: 0, kcal: 2400, cardioKcal: 0,   kind: "baseline", label: "Baseline",    detail: "2,400 kcal, no cardio runs." },
  { index: 1, kcal: 2300, cardioKcal: 0,   kind: "diet",     label: "Diet −100",   detail: "2,400 → 2,300 kcal. Drop 1 slice of protein bread, or ~30 g roasted chana." },
  { index: 2, kcal: 2300, cardioKcal: 100, kind: "cardio",   label: "Cardio +100", detail: "Add a ~1.4 km run. Diet stays at 2,300 kcal." },
  { index: 3, kcal: 2200, cardioKcal: 100, kind: "diet",     label: "Diet −100",   detail: "2,300 → 2,200 kcal. Drop another bread slice or reduce the chana portion." },
  { index: 4, kcal: 2200, cardioKcal: 200, kind: "cardio",   label: "Cardio +100", detail: "Extend the run to ~2.8 km. Diet stays at 2,200 kcal." },
  { index: 5, kcal: 2100, cardioKcal: 200, kind: "diet",     label: "Diet −100",   detail: "2,200 → 2,100 kcal. This is the calorie floor." },
  { index: 6, kcal: 2100, cardioKcal: 300, kind: "cardio",   label: "Cardio +100", detail: "Extend the run to ~4.2 km. This is the ceiling — do not go past it." },
];

/** Shown once the ladder reaches rung 3 or beyond. Straight from the plan. */
export const DEEP_DEFICIT_NOTE =
  "At 2,100 kcal with full cardio you're roughly a third below maintenance. If the mirror and the tape are already moving, holding here beats running the rest of the ladder — steep deficits at a healthy BMI cost muscle as well as fat.";

export const WEIGH_IN_PROTOCOL = [
  "Every morning, same time",
  "Post-toilet, pre-food, pre-water",
  "Same scale, same spot",
  "Log every day without skipping",
];

/** Colour per calorie tier — used by the ladder rail and the week strip. */
export const TIER_COLOR: Record<number, string> = {
  2400: "hsl(var(--jade))",
  2300: "hsl(var(--protein))",
  2200: "hsl(var(--carbs))",
  2100: "hsl(var(--fat))",
};
