import type { Macros } from "@/types/domain";
import { ZERO_MACROS } from "@/types/domain";
import { round } from "./utils";

export interface MacroSource {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export function sumMacros(sources: MacroSource[]): Macros {
  return sources.reduce<Macros>(
    (acc, s) => ({
      kcal: acc.kcal + Number(s.kcal ?? 0),
      protein: acc.protein + Number(s.protein_g ?? 0),
      carbs: acc.carbs + Number(s.carbs_g ?? 0),
      fat: acc.fat + Number(s.fat_g ?? 0),
    }),
    { ...ZERO_MACROS },
  );
}

export const addMacros = (a: Macros, b: Macros): Macros => ({
  kcal: a.kcal + b.kcal,
  protein: a.protein + b.protein,
  carbs: a.carbs + b.carbs,
  fat: a.fat + b.fat,
});

export const roundMacros = (m: Macros): Macros => ({
  kcal: Math.round(m.kcal),
  protein: round(m.protein, 1),
  carbs: round(m.carbs, 1),
  fat: round(m.fat, 1),
});

/** kcal implied by the macro split — useful for sanity-checking hand-entered food. */
export const kcalFromMacros = (m: Pick<Macros, "protein" | "carbs" | "fat">) =>
  m.protein * 4 + m.carbs * 4 + m.fat * 9;

export const proteinPerKg = (protein: number, weightKg: number | null) =>
  weightKg && weightKg > 0 ? round(protein / weightKg, 2) : null;

/** Rule of thumb from the plan: ~1 kcal per kg of bodyweight per km run. */
export const cardioKmForKcal = (kcal: number, bodyweightKg: number | null) =>
  !bodyweightKg || bodyweightKg <= 0 ? null : round(kcal / bodyweightKg, 1);
