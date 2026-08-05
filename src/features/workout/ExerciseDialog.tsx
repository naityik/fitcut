import * as React from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/primitives";
import { SPLITS } from "@/constants/exercises";
import type { ExerciseRow, Split, Unit } from "@/types/database";

type Draft = {
  name: string; split: Split; muscle_group: string; equipment: string;
  unit: Unit; is_permanent: boolean;
};

const EMPTY: Draft = {
  name: "", split: "push", muscle_group: "", equipment: "", unit: "kg", is_permanent: true,
};

const toDraft = (e: ExerciseRow): Draft => ({
  name: e.name,
  split: e.split,
  muscle_group: e.muscle_group ?? "",
  equipment: e.equipment ?? "",
  unit: e.unit,
  is_permanent: e.is_permanent,
});

/**
 * Builds and edits the exercise library from Settings. Anything permanent here shows up
 * in the workout picker for its split, so the library is the single place a lift is
 * defined — the picker never invents one.
 */
export function ExerciseDialog({
  open, onOpenChange, exercise, onCreate, onUpdate, onArchive,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** null means "create a new one". */
  exercise: ExerciseRow | null;
  onCreate: (input: {
    name: string; split: Split; unit: Unit;
    muscle_group?: string; equipment?: string; is_permanent: boolean;
  }) => void;
  onUpdate: (id: string, patch: Partial<ExerciseRow>) => void;
  onArchive: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(EMPTY);

  React.useEffect(() => {
    if (open) setDraft(exercise ? toDraft(exercise) : EMPTY);
  }, [open, exercise]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const valid = draft.name.trim().length >= 2;

  const save = () => {
    if (!valid) return;
    const common = {
      name: draft.name.trim(),
      split: draft.split,
      unit: draft.unit,
      muscle_group: draft.muscle_group.trim() || undefined,
      equipment: draft.equipment.trim() || undefined,
    };
    if (exercise) {
      onUpdate(exercise.id, {
        ...common,
        muscle_group: draft.muscle_group.trim() || null,
        equipment: draft.equipment.trim() || null,
        is_permanent: draft.is_permanent,
      });
    } else {
      onCreate({ ...common, is_permanent: draft.is_permanent });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={exercise ? "Edit exercise" : "New exercise"}
        description="Permanent exercises appear in the workout picker for their split."
      >
        <div className="space-y-3.5">
          <Field label="Name">
            <Input autoFocus placeholder="Machine chest press" value={draft.name}
              onChange={(e) => set("name", e.target.value)} />
          </Field>

          <Field label="Split" hint="Which session it belongs to in the picker.">
            <Segmented
              value={draft.split}
              onChange={(v) => set("split", v as Split)}
              options={SPLITS.map((s) => ({ value: s.value as Split, label: s.label }))}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Muscle group" hint="Optional.">
              <Input placeholder="Chest" value={draft.muscle_group}
                onChange={(e) => set("muscle_group", e.target.value)} />
            </Field>
            <Field label="Equipment" hint="Optional.">
              <Input placeholder="Machine" value={draft.equipment}
                onChange={(e) => set("equipment", e.target.value)} />
            </Field>
          </div>

          <Field label="Unit" hint="Fixed for this exercise — nothing is ever converted.">
            <Segmented
              value={draft.unit}
              onChange={(v) => set("unit", v as Unit)}
              options={[{ value: "kg" as Unit, label: "Kilograms" }, { value: "lb" as Unit, label: "Pounds" }]}
            />
          </Field>

          <label className="flex items-center gap-3 rounded-xl bg-sunken px-3 py-2.5">
            <input
              type="checkbox" checked={draft.is_permanent}
              onChange={(e) => set("is_permanent", e.target.checked)}
              className="h-4 w-4 accent-[hsl(var(--jade))]"
            />
            <span className="text-[13px]">
              Keep in my library
              <span className="block text-[11px] text-faint">
                Turn off to mark it a trial you can decide about later.
              </span>
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            {exercise && (
              <Button
                variant="danger" size="md"
                onClick={() => { onArchive(exercise.id); onOpenChange(false); }}
                aria-label="Remove from library"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="accent" className="flex-1" onClick={save} disabled={!valid}>
              {exercise ? "Save changes" : "Add to library"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
