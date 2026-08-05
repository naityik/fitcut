import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { ExerciseRow, ExerciseSetRow, Split, Unit, WorkoutRow } from "@/types/database";
import type { ExerciseHistoryEntry, LoggedExercise } from "@/types/domain";
import type { ISODate } from "@/lib/date";

export const workoutKeys = {
  library: (userId: string) => ["exercises", userId] as const,
  day: (date: ISODate, split: Split | null) => ["workout", date, split] as const,
  /** Prefix covering every split's query for a day. */
  allForDay: (date: ISODate) => ["workout", date] as const,
  history: (exerciseId: string, before: ISODate) => ["exercise-history", exerciseId, before] as const,
};

// ---------------------------------------------------------------------------
// Exercise library
// ---------------------------------------------------------------------------
export function useExerciseLibrary() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = workoutKeys.library(user!.id);

  const query = useQuery({
    queryKey: key,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises").select("*")
        .eq("archived", false)
        .order("split").order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as ExerciseRow[];
    },
  });

  const createExercise = useMutation({
    mutationFn: async (input: {
      name: string; split: Split; unit: Unit;
      muscle_group?: string; equipment?: string; is_permanent: boolean;
    }) => {
      const { data, error } = await supabase
        .from("exercises")
        .insert({ ...input, user_id: user!.id, sort_order: 999 })
        .select().single();
      if (error) throw new Error(error.message);
      return data as ExerciseRow;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  /** Temporary → permanent. The "I liked that one, keep it" action. */
  const promoteExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").update({ is_permanent: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const updateExercise = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ExerciseRow> }) => {
      const { error } = await supabase.from("exercises").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  /**
   * Archived, never deleted. Sets already logged against this exercise reference the row,
   * so removing it would take history with it.
   */
  const archiveExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").update({ archived: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    exercises: query.data ?? [],
    isLoading: query.isPending,
    createExercise,
    promoteExercise,
    updateExercise,
    archiveExercise,
  };
}

// ---------------------------------------------------------------------------
// A single day's workout
// ---------------------------------------------------------------------------
interface WorkoutDayData {
  workout: WorkoutRow | null;
  logged: LoggedExercise[];
}

/**
 * A day can hold one session per split — the schema allows push and legs on the same
 * date. `selectedSplit` says which of them is on screen; without one, the most recent
 * session of that day is loaded so re-opening the page resumes where you left off.
 */
export function useWorkoutDay(date: ISODate, selectedSplit: Split | null = null) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = workoutKeys.day(date, selectedSplit);
  /**
   * Invalidate every split's query for the day, not just the one on screen. Switching
   * split changes the query key in the same tick that startWorkout fires, so a mutation
   * created under the previous key would otherwise refresh a query nobody is watching
   * and leave the new one holding its first, pre-insert result.
   */
  const invalidate = () => qc.invalidateQueries({ queryKey: workoutKeys.allForDay(date) });

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<WorkoutDayData> => {
      const forDate = supabase.from("workouts").select("*").eq("log_date", date);
      const { data: workout, error } = selectedSplit
        ? await forDate.eq("split", selectedSplit).limit(1).maybeSingle()
        : await forDate.order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      if (!workout) return { workout: null, logged: [] };

      const { data: wes, error: weErr } = await supabase
        .from("workout_exercises")
        .select("*, exercise:exercises(*)")
        .eq("workout_id", workout.id)
        .order("sort_order");
      if (weErr) throw new Error(weErr.message);

      const ids = (wes ?? []).map((w) => w.id as string);
      let sets: ExerciseSetRow[] = [];
      if (ids.length) {
        const { data: setRows, error: setErr } = await supabase
          .from("exercise_sets").select("*")
          .in("workout_exercise_id", ids)
          .order("set_number");
        if (setErr) throw new Error(setErr.message);
        sets = (setRows ?? []) as ExerciseSetRow[];
      }

      return {
        workout: workout as WorkoutRow,
        logged: (wes ?? []).map((we) => ({
          ...(we as unknown as LoggedExercise),
          sets: sets.filter((s) => s.workout_exercise_id === we.id),
        })),
      };
    },
  });

  /** Splits are always chosen by hand — never inferred from the day of week. */
  const startWorkout = useMutation({
    mutationFn: async (split: Split) => {
      const { data, error } = await supabase
        .from("workouts")
        .upsert(
          { user_id: user!.id, log_date: date, split },
          { onConflict: "user_id,log_date,split" },
        )
        .select().single();
      if (error) throw new Error(error.message);
      return data as WorkoutRow;
    },
    onSuccess: invalidate,
  });

  const addExercise = useMutation({
    mutationFn: async ({ workoutId, exerciseId, sortOrder }: {
      workoutId: string; exerciseId: string; sortOrder: number;
    }) => {
      const { data, error } = await supabase
        .from("workout_exercises")
        .insert({ user_id: user!.id, workout_id: workoutId, exercise_id: exerciseId, sort_order: sortOrder })
        .select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: invalidate,
  });

  const removeExercise = useMutation({
    mutationFn: async (workoutExerciseId: string) => {
      const { error } = await supabase.from("workout_exercises").delete().eq("id", workoutExerciseId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const addSet = useMutation({
    mutationFn: async ({ workoutExerciseId, setNumber, unit, seed }: {
      workoutExerciseId: string; setNumber: number; unit: Unit;
      seed?: { weight: number | null; reps: number | null };
    }) => {
      const { error } = await supabase.from("exercise_sets").insert({
        user_id: user!.id,
        workout_exercise_id: workoutExerciseId,
        set_number: setNumber,
        unit,
        weight: seed?.weight ?? null,
        reps: seed?.reps ?? null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  /** Fires on blur of every field. There is no save button anywhere. */
  const updateSet = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ExerciseSetRow> }) => {
      const { error } = await supabase.from("exercise_sets").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<WorkoutDayData>(key);
      if (prev) {
        qc.setQueryData<WorkoutDayData>(key, {
          ...prev,
          logged: prev.logged.map((le) => ({
            ...le,
            sets: le.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
          })),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(key, ctx.prev); },
    onSettled: invalidate,
  });

  const removeSet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercise_sets").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const saveNotes = useMutation({
    mutationFn: async ({ workoutExerciseId, notes }: { workoutExerciseId: string; notes: string }) => {
      const { error } = await supabase
        .from("workout_exercises").update({ notes }).eq("id", workoutExerciseId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return {
    workout: query.data?.workout ?? null,
    logged: query.data?.logged ?? [],
    isLoading: query.isPending,
    startWorkout, addExercise, removeExercise, addSet, updateSet, removeSet, saveNotes,
  };
}

// ---------------------------------------------------------------------------
// Last time you did this lift — shown before you type anything
// ---------------------------------------------------------------------------
export function useLastPerformance(exerciseId: string, beforeDate: ISODate) {
  return useQuery({
    queryKey: workoutKeys.history(exerciseId, beforeDate),
    staleTime: 60_000,
    queryFn: async (): Promise<ExerciseHistoryEntry | null> => {
      const { data, error } = await supabase
        .from("workout_exercises")
        .select("id, notes, workouts!inner(log_date), sets:exercise_sets(weight, reps, rpe, set_number, is_warmup)")
        .eq("exercise_id", exerciseId)
        .lt("workouts.log_date", beforeDate)
        .order("log_date", { referencedTable: "workouts", ascending: false })
        .limit(1);
      if (error) throw new Error(error.message);

      const row = (data ?? [])[0] as
        | { id: string; notes: string | null; workouts: { log_date: string }; sets: ExerciseSetRow[] }
        | undefined;
      if (!row) return null;

      const working = (row.sets ?? [])
        .filter((s) => !s.is_warmup && s.weight != null && s.reps != null)
        .sort((a, b) => a.set_number - b.set_number);
      if (!working.length) return null;

      const top = working.reduce((best, s) =>
        Number(s.weight) > Number(best.weight) ? s : best, working[0]);

      return {
        date: row.workouts.log_date,
        notes: row.notes,
        sets: working.map((s) => ({ weight: Number(s.weight), reps: s.reps, rpe: s.rpe })),
        topSet: { weight: Number(top.weight), reps: top.reps ?? 0 },
        volume: working.reduce((sum, s) => sum + Number(s.weight) * (s.reps ?? 0), 0),
      };
    },
  });
}
