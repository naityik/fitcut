import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { bootstrapUser } from "./seed";
import { phaseWindow, todayISO, type ISODate, type PhaseWindow } from "@/lib/date";
import { targetForDate } from "@/lib/cutLogic";
import type { PhaseRow, PlanStepRow, ProfileRow } from "@/types/database";
import type { DayTarget } from "@/types/domain";

interface PhaseContextValue {
  profile: ProfileRow | null;
  phase: PhaseRow;
  steps: PlanStepRow[];
  window: PhaseWindow;
  targetFor: (date: ISODate) => DayTarget;
  todayTarget: DayTarget;
  refresh: () => void;
}

const PhaseContext = React.createContext<PhaseContextValue | null>(null);

export const phaseKeys = {
  bootstrap: (userId: string) => ["bootstrap", userId] as const,
};

export function PhaseProvider({
  children, fallback,
}: { children: React.ReactNode; fallback: React.ReactNode }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user!.id;

  const { data, isPending, error } = useQuery({
    queryKey: phaseKeys.bootstrap(userId),
    queryFn: async () => {
      const phase = await bootstrapUser(userId);
      const [{ data: profile }, { data: steps }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("plan_steps").select("*").eq("phase_id", phase.id).order("effective_date"),
      ]);
      return {
        phase,
        profile: (profile ?? null) as ProfileRow | null,
        steps: (steps ?? []) as PlanStepRow[],
      };
    },
    staleTime: 60_000,
  });

  const value = React.useMemo<PhaseContextValue | null>(() => {
    if (!data) return null;
    const w = phaseWindow(data.phase.start_date, data.phase.duration_weeks);
    return {
      profile: data.profile,
      phase: data.phase,
      steps: data.steps,
      window: w,
      targetFor: (date) => targetForDate(date, data.phase, data.steps),
      todayTarget: targetForDate(todayISO(), data.phase, data.steps),
      refresh: () => qc.invalidateQueries({ queryKey: phaseKeys.bootstrap(userId) }),
    };
  }, [data, qc, userId]);

  if (isPending) return <>{fallback}</>;
  if (error) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h2 className="font-display text-lg font-bold">Couldn't load your plan</h2>
        <p className="mt-2 text-[13px] text-muted">
          {error instanceof Error ? error.message : "Unknown error."} Check that the schema in
          supabase/schema.sql has been run against this project.
        </p>
      </div>
    );
  }
  return <PhaseContext.Provider value={value}>{children}</PhaseContext.Provider>;
}

export function usePhase() {
  const ctx = React.useContext(PhaseContext);
  if (!ctx) throw new Error("usePhase must be used inside <PhaseProvider>");
  return ctx;
}
