/**
 * Starter library. The user will replace this with their own list — every row
 * is editable, archivable and re-orderable in the app, and `unit` is stored
 * per exercise so a lift logged in lb is always shown in lb.
 */
import type { Split, Unit } from "@/types/database";

export interface SeedExercise {
  name: string;
  split: Split;
  muscle_group: string;
  unit: Unit;
  equipment: string;
}

export const SEED_EXERCISES: SeedExercise[] = [
  // Push
  { name: "Barbell Bench Press",       split: "push", muscle_group: "Chest",      unit: "kg", equipment: "Barbell" },
  { name: "Incline Dumbbell Press",    split: "push", muscle_group: "Chest",      unit: "kg", equipment: "Dumbbell" },
  { name: "Overhead Press",            split: "push", muscle_group: "Shoulders",  unit: "kg", equipment: "Barbell" },
  { name: "Cable Chest Fly",           split: "push", muscle_group: "Chest",      unit: "lb", equipment: "Cable" },
  { name: "Lateral Raise",             split: "push", muscle_group: "Shoulders",  unit: "kg", equipment: "Dumbbell" },
  { name: "Triceps Rope Pushdown",     split: "push", muscle_group: "Triceps",    unit: "lb", equipment: "Cable" },
  { name: "Overhead Triceps Extension",split: "push", muscle_group: "Triceps",    unit: "kg", equipment: "Dumbbell" },

  // Pull
  { name: "Deadlift",                  split: "pull", muscle_group: "Back",       unit: "kg", equipment: "Barbell" },
  { name: "Pull-up",                   split: "pull", muscle_group: "Back",       unit: "kg", equipment: "Bodyweight" },
  { name: "Lat Pulldown",              split: "pull", muscle_group: "Back",       unit: "lb", equipment: "Cable" },
  { name: "Barbell Row",               split: "pull", muscle_group: "Back",       unit: "kg", equipment: "Barbell" },
  { name: "Seated Cable Row",          split: "pull", muscle_group: "Back",       unit: "lb", equipment: "Cable" },
  { name: "Face Pull",                 split: "pull", muscle_group: "Rear delts", unit: "lb", equipment: "Cable" },
  { name: "Barbell Curl",              split: "pull", muscle_group: "Biceps",     unit: "kg", equipment: "Barbell" },
  { name: "Incline Dumbbell Curl",     split: "pull", muscle_group: "Biceps",     unit: "kg", equipment: "Dumbbell" },

  // Legs
  { name: "Back Squat",                split: "legs", muscle_group: "Quads",      unit: "kg", equipment: "Barbell" },
  { name: "Romanian Deadlift",         split: "legs", muscle_group: "Hamstrings", unit: "kg", equipment: "Barbell" },
  { name: "Leg Press",                 split: "legs", muscle_group: "Quads",      unit: "lb", equipment: "Machine" },
  { name: "Walking Lunge",             split: "legs", muscle_group: "Quads",      unit: "kg", equipment: "Dumbbell" },
  { name: "Leg Extension",             split: "legs", muscle_group: "Quads",      unit: "lb", equipment: "Machine" },
  { name: "Seated Leg Curl",           split: "legs", muscle_group: "Hamstrings", unit: "lb", equipment: "Machine" },
  { name: "Standing Calf Raise",       split: "legs", muscle_group: "Calves",     unit: "kg", equipment: "Machine" },
  { name: "Hanging Leg Raise",         split: "legs", muscle_group: "Core",       unit: "kg", equipment: "Bodyweight" },
];

export const SPLITS = [
  { value: "push", label: "Push", blurb: "Chest · Shoulders · Triceps" },
  { value: "pull", label: "Pull", blurb: "Back · Rear delts · Biceps" },
  { value: "legs", label: "Legs", blurb: "Quads · Hamstrings · Calves" },
] as const;
