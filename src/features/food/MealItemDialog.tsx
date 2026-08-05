import * as React from "react";
import { Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { kcalFromMacros } from "@/lib/nutrition";
import type { MealItemRow } from "@/types/database";

type Draft = { name: string; portion: string; kcal: string; protein_g: string; carbs_g: string; fat_g: string };

const toDraft = (i: MealItemRow): Draft => ({
  name: i.name,
  portion: i.portion ?? "",
  kcal: String(i.kcal),
  protein_g: String(i.protein_g),
  carbs_g: String(i.carbs_g),
  fat_g: String(i.fat_g),
});

/**
 * Edits a fixed plan item. Unlike a custom food, this changes the template rather than
 * one day — the meals stay fixed, their numbers do not have to be.
 */
export function MealItemDialog({
  open, onOpenChange, item, onSave, onRemove,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: MealItemRow | null;
  onSave: (id: string, patch: Partial<MealItemRow>) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState<Draft | null>(null);

  React.useEffect(() => {
    if (open && item) setDraft(toDraft(item));
  }, [open, item]);

  if (!item || !draft) return null;

  const set = (key: keyof Draft, value: string) => setDraft((d) => (d ? { ...d, [key]: value } : d));
  const num = (v: string) => (v.trim() === "" ? 0 : Number.parseFloat(v) || 0);

  const macroKcal = kcalFromMacros({
    protein: num(draft.protein_g), carbs: num(draft.carbs_g), fat: num(draft.fat_g),
  });
  const entered = num(draft.kcal);
  const mismatch = entered > 0 && Math.abs(macroKcal - entered) > Math.max(40, entered * 0.15);

  const save = () => {
    if (!draft.name.trim()) return;
    onSave(item.id, {
      name: draft.name.trim(),
      portion: draft.portion.trim() || null,
      kcal: num(draft.kcal),
      protein_g: num(draft.protein_g),
      carbs_g: num(draft.carbs_g),
      fat_g: num(draft.fat_g),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Edit plan item"
        description="Changes apply to this item everywhere, not just today."
      >
        <div className="space-y-3.5">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          </Field>

          <Field label="Portion" hint="How much of it — read off the pack where you can.">
            <Input placeholder="2 slices (50 g)" value={draft.portion}
              onChange={(e) => set("portion", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories">
              <Input type="number" inputMode="decimal" className="tnum"
                value={draft.kcal} onChange={(e) => set("kcal", e.target.value)} />
            </Field>
            <Field label="Protein (g)">
              <Input type="number" inputMode="decimal" className="tnum"
                value={draft.protein_g} onChange={(e) => set("protein_g", e.target.value)} />
            </Field>
            <Field label="Carbs (g)">
              <Input type="number" inputMode="decimal" className="tnum"
                value={draft.carbs_g} onChange={(e) => set("carbs_g", e.target.value)} />
            </Field>
            <Field label="Fat (g)">
              <Input type="number" inputMode="decimal" className="tnum"
                value={draft.fat_g} onChange={(e) => set("fat_g", e.target.value)} />
            </Field>
          </div>

          {mismatch && (
            <p className="text-[12px] text-muted">
              Those macros work out to about {Math.round(macroKcal)} kcal, not {Math.round(entered)}.
              Worth a second look.
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="danger" size="md"
              onClick={() => { onRemove(item.id); onOpenChange(false); }}
              aria-label="Remove from plan"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="accent" className="flex-1" onClick={save} disabled={!draft.name.trim()}>
              Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
