import type {
  ExerciseRow, ExerciseSetRow, MealItemRow, MealRow, PlanStepRow, WorkoutExerciseRow,
} from "./database";

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, carbs: 0, fat: 0 };

/** A meal with its items, plus which items are ticked for the day being viewed. */
export interface MealWithItems extends MealRow {
  items: (MealItemRow & { checked: boolean })[];
}

/** The active rung of the ladder for a given day. */
export interface DayTarget {
  kcal: number;
  cardioKcal: number;
  stepIndex: number;
  kind: PlanStepRow["kind"];
  since: string;
  reason: string | null;
}

export interface WeekSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  label: string;
  entries: { date: string; weightKg: number }[];
  average: number | null;
  delta: number | null;
  /** null until there are enough data points to judge */
  status: "pending" | "baseline" | "progress" | "strong" | "plateau";
  kcalTarget: number;
  cardioKcal: number;
}

export interface LoggedExercise extends WorkoutExerciseRow {
  exercise: ExerciseRow;
  sets: ExerciseSetRow[];
}

export interface ExerciseHistoryEntry {
  date: string;
  sets: { weight: number | null; reps: number | null; rpe: number | null }[];
  notes: string | null;
  topSet: { weight: number; reps: number } | null;
  volume: number;
}
