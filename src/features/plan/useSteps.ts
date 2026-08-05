import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePhase, phaseKeys } from "./PhaseProvider";
import { todayISO } from "@/lib/date";
import type { LadderRung } from "@/constants/plan";

/**
 * Writes the rung the coach recommended, which is what actually moves the daily target.
 * Nothing but the seeder wrote plan_steps before this, so the engine could say "action
 * due" forever and the ladder never advanced.
 */
export function useAcceptStep() {
  const { user } = useAuth();
  const { phase } = usePhase();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (rung: LadderRung) => {
      const { error } = await supabase.from("plan_steps").insert({
        user_id: user!.id,
        phase_id: phase.id,
        step_index: rung.index,
        effective_date: todayISO(),
        kcal_target: rung.kcal,
        cardio_kcal: rung.cardioKcal,
        kind: rung.kind,
        reason: rung.detail,
        accepted_at: new Date().toISOString(),
      });
      if (error) throw new Error(error.message);
    },
    // The target, the ladder rail and the recommendation all derive from these steps.
    onSuccess: () => qc.invalidateQueries({ queryKey: phaseKeys.bootstrap(user!.id) }),
  });
}
