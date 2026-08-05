import * as React from "react";
import { motion } from "framer-motion";
import { Check, Pencil, Plus, Sparkles } from "lucide-react";
import { Card, CardBody, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { MacroBar } from "@/components/charts/ProgressRing";
import { DateBar } from "@/components/layout/DateBar";
import { CustomFoodDialog } from "./CustomFoodDialog";
import { MealItemDialog } from "./MealItemDialog";
import { useFoodDay } from "./useFoodDay";
import { usePhase } from "@/features/plan/PhaseProvider";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { sumMacros } from "@/lib/nutrition";
import { cn, fmtInt, pct, round } from "@/lib/utils";
import type { CustomFoodRow, MealItemRow } from "@/types/database";

export function FoodPage() {
  const { date } = useSelectedDate();
  const { phase, targetFor } = usePhase();
  const target = targetFor(date);
  const food = useFoodDay(date);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomFoodRow | null>(null);
  const [editingItem, setEditingItem] = React.useState<MealItemRow | null>(null);

  const kcalLeft = target.kcal - food.eaten.kcal;
  const planGap = food.planned.kcal - target.kcal;

  return (
    <div className="animate-fade-up">
      <DateBar title="Food" />

      {/* Running totals — sticky so the numbers stay visible while ticking */}
      <div className="glass sticky top-0 z-20 -mx-4 mb-3 border-b border-line px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="tnum font-display text-[26px] font-extrabold leading-none">
              {fmtInt(food.eaten.kcal)}
            </span>
            <span className="tnum text-[13px] text-muted"> / {fmtInt(target.kcal)} kcal</span>
          </div>
          <span className={cn("tnum text-[13px] font-semibold", kcalLeft < 0 ? "text-plateau" : "text-jade")}>
            {kcalLeft >= 0 ? `${fmtInt(kcalLeft)} left` : `${fmtInt(-kcalLeft)} over`}
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          <MiniMacro label="P" eaten={food.eaten.protein} target={phase.protein_target_g} color="hsl(var(--protein))" />
          <MiniMacro label="C" eaten={food.eaten.carbs} target={phase.carbs_target_g} color="hsl(var(--carbs))" />
          <MiniMacro label="F" eaten={food.eaten.fat} target={phase.fat_target_g} color="hsl(var(--fat))" />
        </div>
      </div>

      {food.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {food.meals.map((meal) => {
            const eaten = sumMacros(meal.items.filter((i) => i.checked));
            const total = sumMacros(meal.items);
            const allDone = meal.items.length > 0 && meal.items.every((i) => i.checked);

            return (
              <Card key={meal.id} className={cn(allDone && "border-jade/30 bg-jade/[0.02]")}>
                <div className="flex items-center justify-between gap-3 px-4 pt-4">
                  <div>
                    <h3 className="font-display text-[15px] font-bold tracking-[-0.01em]">{meal.name}</h3>
                    <p className="mt-0.5 text-[11px] text-faint">{meal.time_label}</p>
                  </div>
                  <div className="text-right">
                    <span className="tnum text-[13px] font-bold">
                      {fmtInt(eaten.kcal)}
                      <span className="font-medium text-faint"> / {fmtInt(total.kcal)}</span>
                    </span>
                    <p className="tnum mt-0.5 text-[10px] text-faint">{round(total.protein, 0)} g protein</p>
                  </div>
                </div>

                <CardBody className="pt-3">
                  <ul className="space-y-1">
                    {meal.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-1">
                        <button
                          onClick={() => food.toggleItem.mutate({ itemId: item.id, checked: !item.checked })}
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-ink/[0.03]"
                        >
                          <motion.span
                            animate={{ scale: item.checked ? [1, 1.18, 1] : 1 }}
                            transition={{ duration: 0.28 }}
                            className={cn(
                              "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg border-2 transition-colors",
                              item.checked ? "border-jade bg-jade text-white" : "border-line",
                            )}
                          >
                            {item.checked && <Check className="h-3 w-3" strokeWidth={3.5} />}
                          </motion.span>

                          <span className="min-w-0 flex-1">
                            <span className={cn("block truncate text-[14px]", item.checked ? "text-muted line-through" : "text-ink")}>
                              {item.name}
                            </span>
                            {item.portion && (
                              <span className="block truncate text-[11px] text-faint">{item.portion}</span>
                            )}
                          </span>

                          <span className="tnum shrink-0 text-right">
                            <span className="block text-[13px] font-semibold">{fmtInt(item.kcal)}</span>
                            <span className="block text-[10px] text-faint">{round(item.protein_g, 0)}p</span>
                          </span>
                        </button>

                        <button
                          onClick={() => setEditingItem(item)}
                          aria-label={`Edit ${item.name}`}
                          className="shrink-0 rounded-lg p-2 text-faint transition-colors hover:bg-ink/[0.05] hover:text-ink"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            );
          })}

          {/* Custom foods */}
          <Card>
            <div className="flex items-center justify-between px-4 pt-4">
              <div>
                <h3 className="font-display text-[15px] font-bold tracking-[-0.01em]">Anything else</h3>
                <p className="mt-0.5 text-[11px] text-faint">Off-plan food, just for this day</p>
              </div>
              <Button size="sm" variant="secondary"
                onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>

            <CardBody className="pt-3">
              {food.customFoods.length === 0 ? (
                <p className="px-2 py-3 text-[13px] text-muted">
                  Nothing added. Describe a food and the macros get estimated for you.
                </p>
              ) : (
                <ul className="space-y-1">
                  {food.customFoods.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => { setEditing(f); setDialogOpen(true); }}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-ink/[0.03]"
                      >
                        <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-lg bg-jade text-white">
                          <Check className="h-3 w-3" strokeWidth={3.5} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-[14px]">{f.name}</span>
                            {f.ai_estimated && (
                              <Sparkles className="h-3 w-3 shrink-0 text-protein" aria-label="AI estimated" />
                            )}
                          </span>
                          {f.portion && <span className="block truncate text-[11px] text-faint">{f.portion}</span>}
                        </span>
                        <span className="tnum shrink-0 text-right">
                          <span className="block text-[13px] font-semibold">{fmtInt(f.kcal)}</span>
                          <span className="block text-[10px] text-faint">{round(f.protein_g, 0)}p</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Honest reconciliation between the written plan and the target */}
          {Math.abs(planGap) > 40 && (
            <Card>
              <CardBody>
                <SectionLabel>Plan vs target</SectionLabel>
                <p className="text-[13px] leading-relaxed text-muted">
                  Ticking every fixed meal comes to{" "}
                  <span className="font-semibold text-ink">{fmtInt(food.planned.kcal)} kcal</span> and{" "}
                  <span className="font-semibold text-ink">{round(food.planned.protein, 0)} g protein</span>,
                  against a target of {fmtInt(target.kcal)} kcal.{" "}
                  {planGap > 0
                    ? `That's ${fmtInt(planGap)} kcal over — trim a portion in Settings, or let the tick-list be the target.`
                    : `That's ${fmtInt(-planGap)} kcal under.`}
                </p>
                <Badge tone="neutral" className="mt-2.5">Every item is editable</Badge>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      <CustomFoodDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        onSave={(values) =>
          editing
            ? food.updateCustomFood.mutate({ id: editing.id, patch: values })
            : food.addCustomFood.mutate(values)
        }
        onDelete={(id) => food.deleteCustomFood.mutate(id)}
      />

      <MealItemDialog
        open={editingItem !== null}
        onOpenChange={(v) => { if (!v) setEditingItem(null); }}
        item={editingItem}
        onSave={(id, patch) => food.updateMealItem.mutate({ id, patch })}
        onRemove={(id) => food.removeMealItem.mutate(id)}
      />
    </div>
  );
}

function MiniMacro({
  label, eaten, target, color,
}: { label: string; eaten: number; target: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
        <span className="tnum text-[10px] text-muted">{round(eaten, 0)}/{target}</span>
      </div>
      <MacroBar value={pct(eaten, target)} color={color} />
    </div>
  );
}
