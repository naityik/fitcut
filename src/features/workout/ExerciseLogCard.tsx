import * as React from "react";
import { Check, History, Plus, Trash2, X } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useLastPerformance } from "./useWorkout";
import { estimate1rm, cn } from "@/lib/utils";
import { fmtDayShort, type ISODate } from "@/lib/date";
import type { ExerciseSetRow } from "@/types/database";
import type { LoggedExercise } from "@/types/domain";

interface Props {
  logged: LoggedExercise;
  date: ISODate;
  onAddSet: (setNumber: number, seed?: { weight: number | null; reps: number | null }) => void;
  onUpdateSet: (id: string, patch: Partial<ExerciseSetRow>) => void;
  onRemoveSet: (id: string) => void;
  onRemove: () => void;
  onSaveNotes: (notes: string) => void;
}

export function ExerciseLogCard({
  logged, date, onAddSet, onUpdateSet, onRemoveSet, onRemove, onSaveNotes,
}: Props) {
  const { exercise, sets } = logged;
  const last = useLastPerformance(exercise.id, date);
  const [showNotes, setShowNotes] = React.useState(Boolean(logged.notes));

  const bestSet = sets
    .filter((s) => s.weight != null && s.reps != null)
    .reduce<ExerciseSetRow | null>((best, s) => (!best || Number(s.weight) > Number(best.weight) ? s : best), null);
  const e1rm = bestSet ? estimate1rm(Number(bestSet.weight), bestSet.reps ?? 0) : null;
  const lastTop = last.data?.topSet ?? null;
  const beatLast =
    lastTop && bestSet && bestSet.reps != null
      ? Number(bestSet.weight) > lastTop.weight ||
        (Number(bestSet.weight) === lastTop.weight && bestSet.reps > lastTop.reps)
      : false;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-bold tracking-[-0.01em]">
            {exercise.name}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{exercise.unit}</Badge>
            {exercise.muscle_group && <span className="text-[11px] text-faint">{exercise.muscle_group}</span>}
            {!exercise.is_permanent && <Badge tone="cardio">Trial</Badge>}
            {beatLast && <Badge tone="progress">Beat last time</Badge>}
          </div>
        </div>
        <button onClick={onRemove} aria-label={`Remove ${exercise.name}`}
          className="rounded-lg p-1.5 text-faint transition-colors hover:bg-plateau/10 hover:text-plateau">
          <X className="h-4 w-4" strokeWidth={2.4} />
        </button>
      </div>

      {/* Last time — before you type anything */}
      <div className="mx-4 mt-3 rounded-xl bg-sunken px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <History className="h-3 w-3 text-faint" />
          <span className="eyebrow">Last time</span>
        </div>
        {last.isPending ? (
          <p className="mt-1 text-[12px] text-faint">Looking it up…</p>
        ) : last.data ? (
          <>
            <p className="tnum mt-1.5 text-[13px] text-ink">
              {last.data.sets
                .map((s) => `${s.weight}${exercise.unit} × ${s.reps}`)
                .join("  ·  ")}
            </p>
            <p className="mt-1 text-[11px] text-faint">
              {fmtDayShort(last.data.date)}
              {last.data.notes ? ` — ${last.data.notes}` : ""}
            </p>
          </>
        ) : (
          <p className="mt-1 text-[12px] text-muted">First time logging this one. Set the benchmark.</p>
        )}
      </div>

      <CardBody className="pt-3">
        {/* Column headers */}
        <div className="mb-1.5 grid grid-cols-[28px_1fr_1fr_56px_36px] items-center gap-2 px-1">
          <span className="eyebrow">Set</span>
          <span className="eyebrow">{exercise.unit}</span>
          <span className="eyebrow">Reps</span>
          <span className="eyebrow">RPE</span>
          <span />
        </div>

        <ul className="space-y-1.5">
          {sets.map((set) => (
            <li key={set.id} className="grid grid-cols-[28px_1fr_1fr_56px_36px] items-center gap-2">
              <span className="tnum text-center text-[12px] font-bold text-faint">{set.set_number}</span>
              <NumCell
                value={set.weight}
                placeholder={lastTop ? String(lastTop.weight) : "0"}
                step={0.5}
                onCommit={(v) => onUpdateSet(set.id, { weight: v })}
              />
              <NumCell
                value={set.reps}
                placeholder={lastTop ? String(lastTop.reps) : "0"}
                step={1}
                onCommit={(v) => onUpdateSet(set.id, { reps: v == null ? null : Math.round(v) })}
              />
              <NumCell
                value={set.rpe}
                placeholder="—"
                step={0.5}
                onCommit={(v) => onUpdateSet(set.id, { rpe: v })}
                compact
              />
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onUpdateSet(set.id, { completed: !set.completed })}
                  aria-label={set.completed ? "Mark set incomplete" : "Mark set complete"}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg border-2 transition-colors",
                    set.completed ? "border-jade bg-jade text-white" : "border-line text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3.2} />
                </button>
                <button
                  onClick={() => onRemoveSet(set.id)}
                  aria-label={`Delete set ${set.set_number}`}
                  className="grid h-8 w-6 place-items-center rounded-lg text-faint transition-colors hover:text-plateau"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <Button
          variant="secondary" size="sm" className="mt-2.5 w-full"
          onClick={() => {
            const prev = sets[sets.length - 1];
            onAddSet(sets.length + 1, {
              weight: prev?.weight != null ? Number(prev.weight) : lastTop?.weight ?? null,
              reps: prev?.reps ?? lastTop?.reps ?? null,
            });
          }}
        >
          <Plus className="h-3.5 w-3.5" /> Add set
        </Button>

        {e1rm != null && e1rm > 0 && (
          <p className="tnum mt-2.5 text-center text-[11px] text-faint">
            Best set {Number(bestSet!.weight)}{exercise.unit} × {bestSet!.reps} · est. 1RM{" "}
            {e1rm.toFixed(1)}{exercise.unit}
          </p>
        )}

        {showNotes ? (
          <textarea
            defaultValue={logged.notes ?? ""}
            onBlur={(e) => onSaveNotes(e.target.value)}
            placeholder="Felt heavy, left elbow tight, dropped the last set…"
            rows={2}
            className="mt-3 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[13px] placeholder:text-faint focus:border-jade focus:outline-none focus:ring-2 focus:ring-jade/20"
          />
        ) : (
          <button
            onClick={() => setShowNotes(true)}
            className="mt-2.5 w-full rounded-xl py-1.5 text-[12px] font-medium text-faint transition-colors hover:text-jade"
          >
            Add a note
          </button>
        )}
      </CardBody>
    </Card>
  );
}

/** Autosaving numeric cell. Commits on blur — never on every keystroke. */
function NumCell({
  value, placeholder, step, onCommit, compact,
}: {
  value: number | null;
  placeholder: string;
  step: number;
  onCommit: (v: number | null) => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = React.useState(value != null ? String(value) : "");
  React.useEffect(() => { setDraft(value != null ? String(value) : ""); }, [value]);

  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => e.target.select()}
      onBlur={() => {
        const parsed = draft.trim() === "" ? null : Number.parseFloat(draft);
        const next = parsed != null && Number.isFinite(parsed) ? parsed : null;
        if (next !== value) onCommit(next);
      }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={cn(
        "tnum h-10 w-full rounded-xl border border-line bg-sunken text-center font-semibold text-ink",
        "placeholder:font-normal placeholder:text-faint",
        "focus:border-jade focus:bg-surface focus:outline-none focus:ring-2 focus:ring-jade/20",
        compact ? "text-[13px]" : "text-[15px]",
      )}
    />
  );
}
