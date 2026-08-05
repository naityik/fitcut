import { supabase } from "@/lib/supabase";
import { PHASE_DEFAULTS, SEED_MEALS } from "@/constants/plan";
import { SEED_EXERCISES } from "@/constants/exercises";
import type { PhaseRow } from "@/types/database";

/**
 * First-run setup. Idempotent: every step checks before it writes, so a
 * half-finished seed (dropped connection, closed tab) heals on next load.
 */
export async function ensurePhase(userId: string): Promise<PhaseRow> {
  const { data: existing, error } = await supabase
    .from("phases")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existing) return existing as PhaseRow;

  const { data: phase, error: insErr } = await supabase
    .from("phases")
    .insert({
      user_id: userId,
      name: PHASE_DEFAULTS.name,
      goal: PHASE_DEFAULTS.goal,
      start_date: PHASE_DEFAULTS.startDate,
      duration_weeks: PHASE_DEFAULTS.durationWeeks,
      maintenance_kcal: PHASE_DEFAULTS.maintenanceKcal,
      base_kcal: PHASE_DEFAULTS.baseKcal,
      protein_target_g: PHASE_DEFAULTS.proteinTargetG,
      carbs_target_g: PHASE_DEFAULTS.carbsTargetG,
      fat_target_g: PHASE_DEFAULTS.fatTargetG,
      plateau_threshold_kg: PHASE_DEFAULTS.plateauThresholdKg,
      min_hold_days: PHASE_DEFAULTS.minHoldDays,
      grace_weeks: PHASE_DEFAULTS.graceWeeks,
      step_kcal: PHASE_DEFAULTS.stepKcal,
      cardio_ceiling_kcal: PHASE_DEFAULTS.cardioCeilingKcal,
      kcal_floor: PHASE_DEFAULTS.kcalFloor,
    })
    .select()
    .single();
  if (insErr) throw new Error(insErr.message);
  return phase as PhaseRow;
}

export async function ensureBaselineStep(userId: string, phase: PhaseRow) {
  const { count, error } = await supabase
    .from("plan_steps")
    .select("id", { count: "exact", head: true })
    .eq("phase_id", phase.id);
  if (error) throw new Error(error.message);
  if (count && count > 0) return;

  const { error: insErr } = await supabase.from("plan_steps").insert({
    user_id: userId,
    phase_id: phase.id,
    step_index: 0,
    effective_date: phase.start_date,
    kcal_target: phase.base_kcal,
    cardio_kcal: 0,
    kind: "baseline",
    reason: "Phase start.",
    accepted_at: new Date().toISOString(),
  });
  if (insErr) throw new Error(insErr.message);
}

export async function ensureMeals(userId: string, phase: PhaseRow) {
  const { count, error } = await supabase
    .from("meals")
    .select("id", { count: "exact", head: true })
    .eq("phase_id", phase.id);
  if (error) throw new Error(error.message);
  if (count && count > 0) return;

  for (const [index, meal] of SEED_MEALS.entries()) {
    const { data: created, error: mealErr } = await supabase
      .from("meals")
      .insert({
        user_id: userId, phase_id: phase.id,
        name: meal.name, time_label: meal.time_label, sort_order: index,
      })
      .select()
      .single();
    if (mealErr) throw new Error(mealErr.message);

    const items = meal.items.map((item, i) => ({
      user_id: userId,
      meal_id: created!.id,
      name: item.name,
      portion: item.portion ?? null,
      kcal: item.kcal,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
      sort_order: i,
    }));
    const { error: itemErr } = await supabase.from("meal_items").insert(items);
    if (itemErr) throw new Error(itemErr.message);
  }
}

export async function ensureExercises(userId: string) {
  const { count, error } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (count && count > 0) return;

  const rows = SEED_EXERCISES.map((e, i) => ({ ...e, user_id: userId, sort_order: i, is_permanent: true }));
  const { error: insErr } = await supabase.from("exercises").insert(rows);
  if (insErr) throw new Error(insErr.message);
}

export async function bootstrapUser(userId: string): Promise<PhaseRow> {
  const phase = await ensurePhase(userId);
  await Promise.all([
    ensureBaselineStep(userId, phase),
    ensureMeals(userId, phase),
    ensureExercises(userId),
  ]);
  return phase;
}
