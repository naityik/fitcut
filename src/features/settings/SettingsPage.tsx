import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, LogOut, Plus, Star, Trash2, Undo2 } from "lucide-react";
import { Card, CardBody, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge, Segmented } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePhase, phaseKeys } from "@/features/plan/PhaseProvider";
import { useExerciseLibrary } from "@/features/workout/useWorkout";
import { ExerciseDialog } from "@/features/workout/ExerciseDialog";
import { SPLITS } from "@/constants/exercises";
import { fmtDayLong } from "@/lib/date";
import type { ExerciseRow, PhaseRow, Unit } from "@/types/database";

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { phase, steps, window: win, profile } = usePhase();
  const qc = useQueryClient();
  const [saved, setSaved] = React.useState(false);

  const flagSaved = () => {
    qc.invalidateQueries({ queryKey: phaseKeys.bootstrap(user!.id) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const updatePhase = useMutation({
    mutationFn: async (patch: Partial<PhaseRow>) => {
      const { error } = await supabase.from("phases").update(patch).eq("id", phase.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: flagSaved,
  });

  /**
   * Every screen reads its calorie target from the applicable plan step, never from
   * phase.base_kcal — so writing base_kcal alone changed the number here and nowhere
   * else. The baseline step has to move with it. Later rungs are absolute ladder values
   * and are deliberately left alone: once you have stepped down, this field is history.
   */
  const updateBaseKcal = useMutation({
    mutationFn: async (kcal: number) => {
      const { error } = await supabase
        .from("phases").update({ base_kcal: kcal }).eq("id", phase.id);
      if (error) throw new Error(error.message);

      const baseline = steps.find((s) => s.kind === "baseline");
      if (baseline) {
        const { error: stepErr } = await supabase
          .from("plan_steps").update({ kcal_target: kcal }).eq("id", baseline.id);
        if (stepErr) throw new Error(stepErr.message);
      }
    },
    onSuccess: flagSaved,
  });

  const commit = (patch: Partial<PhaseRow>) => updatePhase.mutate(patch);
  const onBaseline = steps.every((s) => s.kind === "baseline");

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
              <Input type="number" min={800} max={6000} className="tnum" defaultValue={phase.base_kcal}
                onBlur={(e) => {
                  const v = Number.parseInt(e.target.value, 10);
                  if (v >= 800 && v <= 6000) updateBaseKcal.mutate(v);
                  else e.target.value = String(phase.base_kcal);
                }} />
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
            {onBaseline
              ? "You're on the baseline rung, so editing calories moves today's target with it."
              : "You've stepped down the ladder, so the daily target now comes from the step you're on — editing this changes the baseline only, not today."}
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

/** Uses the split's proper label where there is one, so an "other" row still reads well. */
const splitLabel = (value: string) =>
  SPLITS.find((s) => s.value === value)?.label ?? value.charAt(0).toUpperCase() + value.slice(1);

function ExerciseLibrarySettings() {
  const {
    exercises, archivedExercises, promoteExercise, updateExercise,
    createExercise, archiveExercise, restoreExercise, clearLibrary,
  } = useExerciseLibrary();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ExerciseRow | null>(null);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [showArchived, setShowArchived] = React.useState(false);

  const trials = exercises.filter((e) => !e.is_permanent);

  // Grouped off the data, not the SPLITS constant — otherwise anything on the "other"
  // split exists in the database and is invisible here.
  const splitsPresent = [...new Set(exercises.map((e) => e.split))];

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (ex: ExerciseRow) => { setEditing(ex); setDialogOpen(true); };

  return (
    <Card className="mt-3">
      <CardBody>
        <div className="flex items-center justify-between">
          <SectionLabel className="mb-0">Exercise library</SectionLabel>
          <Button size="sm" variant="secondary" onClick={openNew}>
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>
        <p className="mb-3 mt-1.5 text-[12px] text-muted">
          {exercises.length} exercise{exercises.length === 1 ? "" : "s"} — this is exactly what the
          workout picker offers, for the split you are training.
        </p>

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

        <div className="max-h-[420px] space-y-3 overflow-y-auto">
          {splitsPresent.map((s) => (
            <div key={s}>
              <p className="eyebrow mb-1">{splitLabel(s)}</p>
              <ul className="space-y-1">
                {exercises.filter((e) => e.split === s).map((ex) => (
                  <li key={ex.id} className="flex items-center gap-1.5 rounded-xl px-1 py-1.5">
                    <button
                      onClick={() => openEdit(ex)}
                      className="min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-ink/[0.04]"
                    >
                      <span className="block truncate text-[13px] font-medium">{ex.name}</span>
                      <span className="block truncate text-[11px] text-faint">
                        {[ex.muscle_group, ex.equipment].filter(Boolean).join(" · ") || "—"}
                      </span>
                    </button>
                    <Segmented
                      className="w-[104px] shrink-0 p-1"
                      value={ex.unit}
                      onChange={(unit) => updateExercise.mutate({ id: ex.id, patch: { unit: unit as Unit } })}
                      options={[{ value: "kg" as Unit, label: "kg" }, { value: "lb" as Unit, label: "lb" }]}
                    />
                    <button
                      onClick={() => archiveExercise.mutate(ex.id)}
                      aria-label={`Remove ${ex.name}`}
                      className="shrink-0 rounded-lg p-2 text-faint transition-colors hover:bg-plateau/10 hover:text-plateau"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {exercises.length === 0 && (
            <p className="rounded-xl bg-sunken px-3 py-6 text-center text-[13px] text-muted">
              Library is empty. Add your own with <span className="font-semibold text-ink">New</span>.
            </p>
          )}
        </div>

        <p className="mt-2.5 text-[12px] text-muted">
          Tap a name to edit it, the bin to remove it. Unit is fixed per exercise — change it and
          every past and future entry displays in that unit.{" "}
          <Badge tone="neutral">No conversion happens</Badge>
        </p>

        {/* Replacing the seeded starter list wholesale */}
        {exercises.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            {confirmClear ? (
              <div className="rounded-xl bg-plateau/8 p-3">
                <p className="text-[12px] leading-relaxed text-plateau">
                  Remove all {exercises.length} exercises? They are archived rather than deleted, so
                  logged sets keep working and you can put any of them back below.
                </p>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setConfirmClear(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm" variant="danger"
                    onClick={() => { clearLibrary.mutate(); setConfirmClear(false); }}
                  >
                    Remove all
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-[12px] font-semibold text-plateau underline-offset-4 hover:underline"
              >
                Remove all and start my own list
              </button>
            )}
          </div>
        )}

        {archivedExercises.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <button
              onClick={() => setShowArchived((v) => !v)}
              className="text-[12px] font-semibold text-muted underline-offset-4 hover:underline"
            >
              {showArchived ? "Hide" : "Show"} {archivedExercises.length} removed
            </button>
            {showArchived && (
              <ul className="mt-2 max-h-[220px] space-y-1 overflow-y-auto">
                {archivedExercises.map((ex) => (
                  <li key={ex.id} className="flex items-center gap-2 px-1 py-1">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-muted">
                      {ex.name}
                      <span className="text-faint"> · {splitLabel(ex.split)}</span>
                    </span>
                    <Button size="sm" variant="secondary" onClick={() => restoreExercise.mutate(ex.id)}>
                      <Undo2 className="h-3 w-3" /> Restore
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardBody>

      <ExerciseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        exercise={editing}
        onCreate={(input) => createExercise.mutate(input)}
        onUpdate={(id, patch) => updateExercise.mutate({ id, patch })}
        onArchive={(id) => archiveExercise.mutate(id)}
      />
    </Card>
  );
}
