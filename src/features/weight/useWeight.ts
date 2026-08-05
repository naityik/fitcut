import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePhase } from "@/features/plan/PhaseProvider";
import { buildWeekSummaries, evaluateNextStep, type WeightPoint } from "@/lib/cutLogic";
import { todayISO, type ISODate } from "@/lib/date";
import { mean, round } from "@/lib/utils";

export const weightKeys = {
  all: (phaseId: string) => ["weights", phaseId] as const,
};

export function useWeights() {
  const { user } = useAuth();
  const { phase, steps, window: win, targetFor } = usePhase();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: weightKeys.all(phase.id),
    queryFn: async (): Promise<WeightPoint[]> => {
      const { data, error } = await supabase
        .from("weight_entries")
        .select("log_date, weight_kg")
        .gte("log_date", win.start)
        .lte("log_date", win.end)
        .order("log_date");
      if (error) throw new Error(error.message);
      return (data ?? []).map((r) => ({ date: r.log_date as string, weightKg: Number(r.weight_kg) }));
    },
    staleTime: 30_000,
  });

  const saveWeight = useMutation({
    mutationFn: async ({ date, weightKg }: { date: ISODate; weightKg: number }) => {
      const { error } = await supabase
        .from("weight_entries")
        .upsert(
          { user_id: user!.id, log_date: date, weight_kg: weightKg },
          { onConflict: "user_id,log_date" },
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ date, weightKg }) => {
      await qc.cancelQueries({ queryKey: weightKeys.all(phase.id) });
      const prev = qc.getQueryData<WeightPoint[]>(weightKeys.all(phase.id)) ?? [];
      const next = prev.filter((p) => p.date !== date).concat({ date, weightKg });
      next.sort((a, b) => (a.date < b.date ? -1 : 1));
      qc.setQueryData(weightKeys.all(phase.id), next);
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(weightKeys.all(phase.id), ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: weightKeys.all(phase.id) }),
  });

  const removeWeight = useMutation({
    mutationFn: async (date: ISODate) => {
      const { error } = await supabase.from("weight_entries").delete().eq("log_date", date);
      if (error) throw new Error(error.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: weightKeys.all(phase.id) }),
  });

  const points = query.data ?? [];
  const byDate = new Map(points.map((p) => [p.date, p.weightKg]));
  const today = todayISO();

  const weeks = buildWeekSummaries(phase, points, steps, today);
  const currentWeek = weeks[weeks.length - 1] ?? null;
  const previousWeek = weeks.length > 1 ? weeks[weeks.length - 2] : null;
  const recommendation = evaluateNextStep(phase, weeks, targetFor(today), today);

  const completed = weeks.filter((w) => w.average != null);
  const first = completed[0]?.average ?? null;
  const last = completed[completed.length - 1]?.average ?? null;
  const avgLossPerWeek =
    first != null && last != null && completed.length > 1
      ? round((first - last) / (completed.length - 1), 2)
      : null;

  const last7 = points.slice(-7).map((p) => p.weightKg);

  return {
    points,
    byDate,
    weeks,
    currentWeek,
    previousWeek,
    recommendation,
    avgLossPerWeek,
    rolling7: last7.length ? round(mean(last7)!, 2) : null,
    startingWeight: phase.starting_weight_kg ?? points[0]?.weightKg ?? null,
    latest: points[points.length - 1] ?? null,
    isLoading: query.isPending,
    saveWeight,
    removeWeight,
  };
}
