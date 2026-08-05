import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { ExerciseRow, ExerciseSetRow, Split, Unit, WorkoutRow } from "@/types/database";
import type { ExerciseHistoryEntry, LoggedExercise } from "@/types/domain";
import type { ISODate } from "@/lib/date";

export const workoutKeys = {
  library: (userId: string) => ["exercises", userId] as const,
  day: (date: ISODate) => ["workout", date] as const,
  history: (exerciseId: string, before: ISODate) => ["exercise-history", exerciseId, before] as const,
};

// ---------------------------------------------------------------------------
// Exercise library
// ---------------------------------------------------------------------------
export function useExerciseLibrary() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = workoutKeys.library(user!.id);

  /**
   * Fetches archived rows too, so Settings can show what was removed and put it back.
   * Everything else reads `exercises`, which is the live list only.
   */
  const query = useQuery({
    queryKey: key,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercises").select("*")
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

  const restoreExercise = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exercises").update({ archived: false }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  /**
   * Clears the library in one go — for replacing the seeded starter list with your own.
   * Archives rather than deletes, so it is undoable from the archived list and no logged
   * set loses the row it points at.
   */
  const clearLibrary = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("exercises")
        .update({ archived: true })
        .eq("user_id", user!.id)
        .eq("archived", false);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const all = query.data ?? [];

  return {
    exercises: all.filter((e) => !e.archived),
    archivedExercises: all.filter((e) => e.archived),
    isLoading: query.isPending,
    createExercise,
    promoteExercise,
    updateExercise,
    archiveExercise,
    restoreExercise,
    clearLibrary,
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
 * One session per day, whose split you can change.
 *
 * The schema permits a row per split per day, but that is not how the day is worked:
 * picking Legs after Pull means "today is legs", not "today is a second session". Read
 * and write therefore both address a single row — the one most recently touched.
 */
export function useWorkoutDay(date: ISODate) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = workoutKeys.day(date);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: key });
    // "Last time you did this lift" is derived from logged sets, so it goes stale the
    // moment one is edited.
    qc.invalidateQueries({ queryKey: ["exercise-history"] });
  };

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<WorkoutDayData> => {
      const { data: workout, error } = await supabase
        .from("workouts").select("*")
        .eq("log_date", date)
        .order("updated_at", { ascending: false })
        .limit(1).maybeSingle();
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

  /**
   * Splits are always chosen by hand — never inferred from the day of week.
   *
   * Changing the split re-labels the day's existing session rather than starting another
   * one, which is what made the control appear to snap back: a second row was written,
   * and the read kept returning the first. Order matters below — a row already carrying
   * the target split is reused before any row is re-labelled, so this can never collide
   * with unique (user_id, log_date, split) where that constraint exists.
   *
   * `updated_at` is set explicitly rather than left to the touch trigger, since the read
   * orders by it and a database missing that trigger would otherwise keep resolving to
   * the wrong row.
   */
  const startWorkout = useMutation({
    mutationFn: async (split: Split) => {
      const touch = { split, updated_at: new Date().toISOString() };

      const { data: sameSplit, error: sameErr } = await supabase
        .from("workouts").select("*")
        .eq("log_date", date).eq("split", split)
        .limit(1).maybeSingle();
      if (sameErr) throw new Error(sameErr.message);
      if (sameSplit) {
        const { data, error } = await supabase
          .from("workouts").update(touch).eq("id", sameSplit.id).select().single();
        if (error) throw new Error(error.message);
        return data as WorkoutRow;
      }

      const { data: anySession, error: anyErr } = await supabase
        .from("workouts").select("*")
        .eq("log_date", date)
        .order("updated_at", { ascending: false })
        .limit(1).maybeSingle();
      if (anyErr) throw new Error(anyErr.message);
      if (anySession) {
        const { data, error } = await supabase
          .from("workouts").update(touch).eq("id", anySession.id).select().single();
        if (error) throw new Error(error.message);
        return data as WorkoutRow;
      }

      const { data, error } = await supabase
        .from("workouts")
        .insert({ user_id: user!.id, log_date: date, split })
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
