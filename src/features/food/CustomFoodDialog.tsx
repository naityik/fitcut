import * as React from "react";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { estimateFood, EstimatorUnavailable } from "./estimateFood";
import { kcalFromMacros } from "@/lib/nutrition";
import type { CustomFoodRow } from "@/types/database";

type Draft = {
  name: string; portion: string;
  kcal: string; protein_g: string; carbs_g: string; fat_g: string;
  ai_estimated: boolean; ai_note: string;
};

const EMPTY: Draft = {
  name: "", portion: "", kcal: "", protein_g: "", carbs_g: "", fat_g: "",
  ai_estimated: false, ai_note: "",
};

const toDraft = (f: CustomFoodRow): Draft => ({
  name: f.name, portion: f.portion ?? "",
  kcal: String(f.kcal), protein_g: String(f.protein_g),
  carbs_g: String(f.carbs_g), fat_g: String(f.fat_g),
  ai_estimated: f.ai_estimated, ai_note: f.ai_note ?? "",
});

export function CustomFoodDialog({
  open, onOpenChange, editing, onSave, onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: CustomFoodRow | null;
  onSave: (values: Omit<CustomFoodRow, "id" | "user_id" | "log_date" | "created_at" | "updated_at">) => void;
  onDelete?: (id: string) => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [estimating, setEstimating] = React.useState(false);
  const [estimateError, setEstimateError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setDraft(editing ? toDraft(editing) : EMPTY);
      setEstimateError(null);
    }
  }, [open, editing]);

  const set = (key: keyof Draft, value: string) => setDraft((d) => ({ ...d, [key]: value }));
  const num = (v: string) => (v.trim() === "" ? 0 : Number.parseFloat(v) || 0);

  const runEstimate = async () => {
    if (draft.name.trim().length < 2) return;
    setEstimating(true);
    setEstimateError(null);
    try {
      const result = await estimateFood(
        draft.portion ? `${draft.name} — ${draft.portion}` : draft.name,
      );
      setDraft({
        name: result.name,
        portion: result.portion,
        kcal: String(result.kcal),
        protein_g: String(result.protein_g),
        carbs_g: String(result.carbs_g),
        fat_g: String(result.fat_g),
        ai_estimated: true,
        ai_note: result.note,
      });
    } catch (err) {
      setEstimateError(
        err instanceof EstimatorUnavailable
          ? "Estimator isn't reachable — deploy the estimate-food function, or type the numbers in below."
          : "Couldn't estimate that. Type the numbers in below.",
      );
    } finally {
      setEstimating(false);
    }
  };

  const macroKcal = kcalFromMacros({
    protein: num(draft.protein_g), carbs: num(draft.carbs_g), fat: num(draft.fat_g),
  });
  const entered = num(draft.kcal);
  const mismatch = entered > 0 && Math.abs(macroKcal - entered) > Math.max(60, entered * 0.15);

  const save = () => {
    if (!draft.name.trim()) return;
    onSave({
      name: draft.name.trim(),
      portion: draft.portion.trim() || null,
      kcal: num(draft.kcal),
      protein_g: num(draft.protein_g),
      carbs_g: num(draft.carbs_g),
      fat_g: num(draft.fat_g),
      ai_estimated: draft.ai_estimated,
      ai_note: draft.ai_note || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={editing ? "Edit food" : "Add food"}
        description="Anything outside the fixed plan. Saved to this day only."
      >
        <div className="space-y-3.5">
          <Field label="What did you eat?">
            <Input
              placeholder="2 rotis with dal"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runEstimate(); }}
              autoFocus
            />
          </Field>

          <Field label="Portion" hint="Optional — a rough amount makes the estimate better.">
            <Input
              placeholder="1 bowl, ~200 g"
              value={draft.portion}
              onChange={(e) => set("portion", e.target.value)}
            />
          </Field>

          <Button
            variant="secondary" className="w-full"
            onClick={runEstimate}
            disabled={estimating || draft.name.trim().length < 2}
          >
            {estimating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {estimating ? "Estimating…" : "Estimate the macros"}
          </Button>

          {estimateError && (
            <p className="rounded-xl bg-cardio/8 px-3 py-2.5 text-[12px] leading-relaxed text-cardio">
              {estimateError}
            </p>
          )}
          {draft.ai_note && !estimateError && (
            <p className="rounded-xl bg-jade/8 px-3 py-2.5 text-[12px] leading-relaxed text-jade">
              {draft.ai_note} Adjust anything that's off.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories">
              <Input type="number" inputMode="decimal" placeholder="0" className="tnum"
                value={draft.kcal} onChange={(e) => set("kcal", e.target.value)} />
            </Field>
            <Field label="Protein (g)">
              <Input type="number" inputMode="decimal" placeholder="0" className="tnum"
                value={draft.protein_g} onChange={(e) => set("protein_g", e.target.value)} />
            </Field>
            <Field label="Carbs (g)">
              <Input type="number" inputMode="decimal" placeholder="0" className="tnum"
                value={draft.carbs_g} onChange={(e) => set("carbs_g", e.target.value)} />
            </Field>
            <Field label="Fat (g)">
              <Input type="number" inputMode="decimal" placeholder="0" className="tnum"
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
            {editing && onDelete && (
              <Button
                variant="danger" size="md"
                onClick={() => { onDelete(editing.id); onOpenChange(false); }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button variant="accent" className="flex-1" onClick={save} disabled={!draft.name.trim()}>
              {editing ? "Save changes" : "Add to today"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
