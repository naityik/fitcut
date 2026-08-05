import * as React from "react";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Badge, Segmented } from "@/components/ui/primitives";
import { useExerciseLibrary } from "./useWorkout";
import { cn } from "@/lib/utils";
import type { Split, Unit } from "@/types/database";

export function AddExerciseDialog({
  open, onOpenChange, split, alreadyAdded, onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  split: Split;
  alreadyAdded: Set<string>;
  onPick: (exerciseId: string) => void;
}) {
  const { exercises, createExercise } = useExerciseLibrary();
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newUnit, setNewUnit] = React.useState<Unit>("kg");
  const [permanent, setPermanent] = React.useState(false);

  React.useEffect(() => {
    if (open) { setQuery(""); setCreating(false); setNewName(""); }
  }, [open]);

  const results = exercises
    .filter((e) => !alreadyAdded.has(e.id))
    .filter((e) => (query ? e.name.toLowerCase().includes(query.toLowerCase()) : e.split === split));

  const create = async () => {
    if (newName.trim().length < 2) return;
    const created = await createExercise.mutateAsync({
      name: newName.trim(), split, unit: newUnit, is_permanent: permanent,
    });
    onPick(created.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={creating ? "New exercise" : "Add an exercise"}
        description={creating ? "Trial ones stay out of your library until you keep them." : undefined}
      >
        {creating ? (
          <div className="space-y-3.5">
            <Field label="Name">
              <Input autoFocus placeholder="Machine chest press" value={newName}
                onChange={(e) => setNewName(e.target.value)} />
            </Field>

            <Field label="Unit" hint="Fixed for this exercise — it always displays in this unit.">
              <Segmented
                value={newUnit}
                onChange={(v) => setNewUnit(v)}
                options={[{ value: "kg" as Unit, label: "Kilograms" }, { value: "lb" as Unit, label: "Pounds" }]}
              />
            </Field>

            <label className="flex items-center gap-3 rounded-xl bg-sunken px-3 py-2.5">
              <input
                type="checkbox" checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--jade))]"
              />
              <span className="text-[13px]">
                Add to my permanent library
                <span className="block text-[11px] text-faint">
                  Leave off to trial it — you can keep it later from Settings.
                </span>
              </span>
            </label>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setCreating(false)}>Back</Button>
              <Button variant="accent" className="flex-1" onClick={create}
                disabled={newName.trim().length < 2 || createExercise.isPending}>
                Add to workout
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <Input autoFocus placeholder="Search all exercises" className="pl-9"
                value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>

            <ul className="max-h-[46vh] space-y-1 overflow-y-auto">
              {results.map((ex) => (
                <li key={ex.id}>
                  <button
                    onClick={() => { onPick(ex.id); onOpenChange(false); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{ex.name}</span>
                      <span className="block truncate text-[11px] text-faint">
                        {[ex.muscle_group, ex.equipment].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <Badge tone="neutral">{ex.unit}</Badge>
                    {!ex.is_permanent && <Badge tone="cardio">Trial</Badge>}
                  </button>
                </li>
              ))}
              {results.length === 0 && (
                <li className={cn("px-3 py-6 text-center text-[13px] text-muted")}>
                  Nothing matching. Create it below.
                </li>
              )}
            </ul>

            <Button variant="secondary" className="w-full" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New exercise
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
