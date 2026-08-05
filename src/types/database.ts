/**
 * Hand-authored to match supabase/schema.sql.
 * Once the project is linked you can replace this file wholesale with:
 *   npx supabase gen types typescript --linked > src/types/database.ts
 */
export type Split = "push" | "pull" | "legs" | "other";
export type Unit = "kg" | "lb";
export type StepKind = "baseline" | "diet" | "cardio" | "manual";
export type Severity = "info" | "good" | "warn" | "action";

export type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  height_cm: number | null;
  weight_unit: Unit;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PhaseRow = {
  id: string;
  user_id: string;
  name: string;
  goal: "cut" | "recomp" | "bulk" | "maintain";
  start_date: string;
  duration_weeks: number;
  starting_weight_kg: number | null;
  maintenance_kcal: number;
  base_kcal: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
  plateau_threshold_kg: number;
  min_hold_days: number;
  grace_weeks: number;
  step_kcal: number;
  cardio_ceiling_kcal: number;
  kcal_floor: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PlanStepRow = {
  id: string;
  user_id: string;
  phase_id: string;
  step_index: number;
  effective_date: string;
  kcal_target: number;
  cardio_kcal: number;
  kind: StepKind;
  reason: string | null;
  accepted_at: string | null;
  created_at: string;
}

export type MealRow = {
  id: string;
  user_id: string;
  phase_id: string;
  name: string;
  time_label: string | null;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export type MealItemRow = {
  id: string;
  user_id: string;
  meal_id: string;
  name: string;
  portion: string | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sort_order: number;
  archived: boolean;
  created_at: string;
}

export type MealItemCheckRow = {
  id: string;
  user_id: string;
  meal_item_id: string;
  log_date: string;
  checked: boolean;
  updated_at: string;
}

export type CustomFoodRow = {
  id: string;
  user_id: string;
  log_date: string;
  name: string;
  portion: string | null;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ai_estimated: boolean;
  ai_note: string | null;
  created_at: string;
  updated_at: string;
}

export type WeightEntryRow = {
  id: string;
  user_id: string;
  log_date: string;
  weight_kg: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type ExerciseRow = {
  id: string;
  user_id: string;
  name: string;
  split: Split;
  muscle_group: string | null;
  unit: Unit;
  equipment: string | null;
  is_permanent: boolean;
  archived: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type WorkoutRow = {
  id: string;
  user_id: string;
  log_date: string;
  split: Split;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkoutExerciseRow = {
  id: string;
  user_id: string;
  workout_id: string;
  exercise_id: string;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export type ExerciseSetRow = {
  id: string;
  user_id: string;
  workout_exercise_id: string;
  set_number: number;
  weight: number | null;
  unit: Unit;
  reps: number | null;
  rpe: number | null;
  is_warmup: boolean;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export type ProgressPhotoRow = {
  id: string;
  user_id: string;
  log_date: string;
  storage_path: string;
  pose: "front" | "side" | "back" | "other";
  weight_kg: number | null;
  created_at: string;
}

export type AiInsightRow = {
  id: string;
  user_id: string;
  kind: string;
  severity: Severity;
  title: string;
  body: string | null;
  evidence: Record<string, unknown>;
  for_date: string;
  dismissed_at: string | null;
  created_at: string;
}

export type DailyMetricRow = {
  id: string;
  user_id: string;
  log_date: string;
  metric_key: string;
  value_num: number | null;
  value_text: string | null;
  value_json: Record<string, unknown> | null;
  updated_at: string;
}

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/**
 * One foreign key, named the way Postgres names an inline `references` in schema.sql.
 * These are what let PostgREST resolve an embedded select — `exercise:exercises(*)`
 * only types correctly because workout_exercises declares its FK to exercises below.
 */
type FK<T extends string, C extends string, R extends string> = {
  foreignKeyName: `${T}_${C}_fkey`;
  columns: [C];
  isOneToOne: false;
  referencedRelation: R;
  referencedColumns: ["id"];
};

type TableDef<R, Rels extends Relationship[] = []> = {
  Row: R;
  Insert: Partial<R>;
  Update: Partial<R>;
  Relationships: Rels;
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow>;
      phases: TableDef<PhaseRow>;
      plan_steps: TableDef<PlanStepRow, [FK<"plan_steps", "phase_id", "phases">]>;
      meals: TableDef<MealRow, [FK<"meals", "phase_id", "phases">]>;
      meal_items: TableDef<MealItemRow, [FK<"meal_items", "meal_id", "meals">]>;
      meal_item_checks: TableDef<
        MealItemCheckRow,
        [FK<"meal_item_checks", "meal_item_id", "meal_items">]
      >;
      custom_foods: TableDef<CustomFoodRow>;
      weight_entries: TableDef<WeightEntryRow>;
      exercises: TableDef<ExerciseRow>;
      workouts: TableDef<WorkoutRow>;
      workout_exercises: TableDef<
        WorkoutExerciseRow,
        [
          FK<"workout_exercises", "workout_id", "workouts">,
          FK<"workout_exercises", "exercise_id", "exercises">,
        ]
      >;
      exercise_sets: TableDef<
        ExerciseSetRow,
        [FK<"exercise_sets", "workout_exercise_id", "workout_exercises">]
      >;
      progress_photos: TableDef<ProgressPhotoRow>;
      ai_insights: TableDef<AiInsightRow>;
      daily_metrics: TableDef<DailyMetricRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
