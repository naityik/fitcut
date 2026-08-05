import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, LogOut, Star } from "lucide-react";
import { Card, CardBody, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge, Segmented } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePhase, phaseKeys } from "@/features/plan/PhaseProvider";
import { useExerciseLibrary } from "@/features/workout/useWorkout";
import { fmtDayLong } from "@/lib/date";
import type { PhaseRow, Unit } from "@/types/database";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { phase, window: win, profile } = usePhase();
  const qc = useQueryClient();
  const [saved, setSaved] = React.useState(false);

  const updatePhase = useMutation({
    mutationFn: async (patch: Partial<PhaseRow>) => {
      const { error } = await supabase.from("phases").update(patch).eq("id", phase.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: phaseKeys.bootstrap(user!.id) });
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    },
  });

  const commit = (patch: Partial<PhaseRow>) => updatePhase.mutate(patch);

  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <p className="eyebrow">Account · {profile?.display_name ?? user?.email}</p>
        <h1 className="mt-1 font-display text-[26px] font-extrabold leading-none tracking-[-0.03em]">
          Settings
        </h1>
      </header>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <SectionLabel className="mb-0">The phase</SectionLabel>
            {saved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-progress">
                <Check className="h-3 w-3" strokeWidth={3} /> Saved
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Start date">
              <Input type="date" defaultValue={phase.start_date}
                onBlur={(e) => e.target.value && commit({ start_date: e.target.value })} />
            </Field>
            <Field label="Length (weeks)">
              <Input type="number" min={1} max={104} defaultValue={phase.duration_weeks} className="tnum"
                onBlur={(e) => {
                  const v = Number.parseInt(e.target.value, 10);
                  if (v >= 1 && v <= 104) commit({ duration_weeks: v });
                }} />
            </Field>
          </div>
          <p className="mt-2 text-[12px] text-muted">
            Currently {fmtDayLong(win.start)} → {fmtDayLong(win.end)} · {win.totalDays} days.
          </p>
        </CardBody>
      </Card>

      <Card className="mt-3">
        <CardBody>
          <SectionLabel>Daily targets</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Calories">
              <Input type="number" className="tnum" defaultValue={phase.base_kcal}
                onBlur={(e) => commit({ base_kcal: Number(e.target.value) })} />
            </Field>
            <Field label="Protein (g)">
              <Input type="number" className="tnum" defaultValue={phase.protein_target_g}
                onBlur={(e) => commit({ protein_target_g: Number(e.target.value) })} />
            </Field>
            <Field label="Carbs (g)">
              <Input type="number" className="tnum" defaultValue={phase.carbs_target_g}
                onBlur={(e) => commit({ carbs_target_g: Number(e.target.value) })} />
            </Field>
            <Field label="Fat (g)">
              <Input type="number" className="tnum" defaultValue={phase.fat_target_g}
                onBlur={(e) => commit({ fat_target_g: Number(e.target.value) })} />
            </Field>
          </div>
          <p className="mt-2 text-[12px] text-muted">
            The calorie figure here is the baseline. Once the ladder steps down, the daily target
            comes from the step, not from this field.
          </p>
        </CardBody>
      </Card>

      <Card className="mt-3">
        <CardBody>
          <SectionLabel>The decision rule</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Plateau under (kg)">
              <Input type="number" step="0.01" className="tnum" defaultValue={phase.plateau_threshold_kg}
                onBlur={(e) => commit({ plateau_threshold_kg: Number(e.target.value) })} />
            </Field>
            <Field label="Hold each step (days)">
              <Input type="number" className="tnum" defaultValue={phase.min_hold_days}
                onBlur={(e) => commit({ min_hold_days: Number(e.target.value) })} />
            </Field>
            <Field label="Ignore first (weeks)">
              <Input type="number" className="tnum" defaultValue={phase.grace_weeks}
                onBlur={(e) => commit({ grace_weeks: Number(e.target.value) })} />
            </Field>
            <Field label="Cardio ceiling (kcal)">
              <Input type="number" className="tnum" defaultValue={phase.cardio_ceiling_kcal}
                onBlur={(e) => commit({ cardio_ceiling_kcal: Number(e.target.value) })} />
            </Field>
          </div>
        </CardBody>
      </Card>

      <ExerciseLibrarySettings />

      <Card className="mt-3">
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold">Signed in as</p>
            <p className="text-[12px] text-muted">{user?.email}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => signOut()}>
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

function ExerciseLibrarySettings() {
  const { exercises, promoteExercise, updateExercise } = useExerciseLibrary();
  const trials = exercises.filter((e) => !e.is_permanent);

  return (
    <Card className="mt-3">
      <CardBody>
        <SectionLabel>Exercise library</SectionLabel>

        {trials.length > 0 && (
          <div className="mb-4 rounded-xl bg-cardio/6 p-3">
            <p className="text-[12px] font-semibold text-cardio">
              {trials.length} trial exercise{trials.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-2 space-y-1.5">
              {trials.map((ex) => (
                <li key={ex.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[13px]">{ex.name}</span>
                  <Button size="sm" variant="secondary" onClick={() => promoteExercise.mutate(ex.id)}>
                    <Star className="h-3 w-3" /> Keep
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul className="max-h-[340px] space-y-1 overflow-y-auto">
          {exercises.map((ex) => (
            <li key={ex.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{ex.name}</span>
                <span className="block truncate text-[11px] text-faint capitalize">
                  {ex.split} · {ex.muscle_group ?? "—"}
                </span>
              </span>
              <Segmented
                className="w-[132px] p-1"
                value={ex.unit}
                onChange={(unit) => updateExercise.mutate({ id: ex.id, patch: { unit: unit as Unit } })}
                options={[{ value: "kg" as Unit, label: "kg" }, { value: "lb" as Unit, label: "lb" }]}
              />
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-[12px] text-muted">
          Unit is fixed per exercise — change it here and every past and future entry displays in
          that unit. <Badge tone="neutral">No conversion happens</Badge>
        </p>
      </CardBody>
    </Card>
  );
}
