import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import type { ISODate } from "@/lib/date";

/**
 * Progress lives in `daily_metrics`, the table the schema keeps for anything day-shaped:
 * one row per user/day/key, no migration needed. A completed day *is* a row — presence is
 * the record — so ticking never has to upsert, and therefore never depends on a unique
 * constraint being present on the table.
 *
 * The original artifact stored this in the browser. Here it follows the account, so the
 * plan reads the same on a phone at the gym as on the laptop it was written on.
 */
export const LEARN_METRIC_KEY = "learn_day";

export const learnKeys = {
  progress: (userId: string) => ["learn", userId] as const,
};

export function useLearnProgress() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = learnKeys.progress(user!.id);

  const query = useQuery({
    queryKey: key,
    staleTime: 30_000,
    queryFn: async (): Promise<Set<ISODate>> => {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("log_date")
        .eq("metric_key", LEARN_METRIC_KEY);
      if (error) throw new Error(error.message);
      return new Set((data ?? []).map((r) => r.log_date as ISODate));
    },
  });

  /** Optimistic: a tick has to land instantly, the same as the food checkboxes. */
  const toggleDay = useMutation({
    mutationFn: async ({ date, done }: { date: ISODate; done: boolean }) => {
      if (!done) {
        const { error } = await supabase
          .from("daily_metrics")
          .delete()
          .eq("metric_key", LEARN_METRIC_KEY)
          .eq("log_date", date);
        if (error) throw new Error(error.message);
        return;
      }

      const { data: existing, error: findErr } = await supabase
        .from("daily_metrics")
        .select("id")
        .eq("metric_key", LEARN_METRIC_KEY)
        .eq("log_date", date)
        .limit(1)
        .maybeSingle();
      if (findErr) throw new Error(findErr.message);
      if (existing) return;

      const { error } = await supabase.from("daily_metrics").insert({
        user_id: user!.id,
        log_date: date,
        metric_key: LEARN_METRIC_KEY,
        value_num: 1,
      });
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ date, done }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Set<ISODate>>(key);
      if (prev) {
        const next = new Set(prev);
        if (done) next.add(date);
        else next.delete(date);
        qc.setQueryData<Set<ISODate>>(key, next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("daily_metrics")
        .delete()
        .eq("user_id", user!.id)
        .eq("metric_key", LEARN_METRIC_KEY);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return {
    done: query.data ?? new Set<ISODate>(),
    isLoading: query.isPending,
    toggleDay,
    clearAll,
  };
}
