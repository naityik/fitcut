import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/features/auth/AuthProvider";
import { usePhase } from "@/features/plan/PhaseProvider";
import { sumMacros } from "@/lib/nutrition";
import type { CustomFoodRow, MealItemRow, MealRow } from "@/types/database";
import type { Macros, MealWithItems } from "@/types/domain";
import type { ISODate } from "@/lib/date";

export const foodKeys = {
  template: (phaseId: string) => ["food", "template", phaseId] as const,
  day: (date: ISODate) => ["food", "day", date] as const,
};

/** Meals + items. Cached hard — this only changes when the plan is edited. */
export function useMealTemplate() {
  const { phase } = usePhase();
  return useQuery({
    queryKey: foodKeys.template(phase.id),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: meals, error } = await supabase
        .from("meals").select("*")
        .eq("phase_id", phase.id).eq("archived", false)
        .order("sort_order");
      if (error) throw new Error(error.message);

      const ids = (meals ?? []).map((m) => m.id);
      if (!ids.length) return [] as (MealRow & { items: MealItemRow[] })[];

      const { data: items, error: itemErr } = await supabase
        .from("meal_items").select("*")
        .in("meal_id", ids).eq("archived", false)
        .order("sort_order");
      if (itemErr) throw new Error(itemErr.message);

      return (meals ?? []).map((m) => ({
        ...(m as MealRow),
        items: ((items ?? []) as MealItemRow[]).filter((i) => i.meal_id === m.id),
      }));
    },
  });
}

interface DayData {
  checkedIds: Set<string>;
  customFoods: CustomFoodRow[];
}

export function useFoodDay(date: ISODate) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { phase } = usePhase();
  const template = useMealTemplate();
  const invalidateTemplate = () =>
    qc.invalidateQueries({ queryKey: foodKeys.template(phase.id) });

  const day = useQuery({
    queryKey: foodKeys.day(date),
    queryFn: async (): Promise<DayData> => {
      const [checks, customs] = await Promise.all([
        supabase.from("meal_item_checks").select("meal_item_id, checked").eq("log_date", date),
        supabase.from("custom_foods").select("*").eq("log_date", date).order("created_at"),
      ]);
      if (checks.error) throw new Error(checks.error.message);
      if (customs.error) throw new Error(customs.error.message);
      return {
        checkedIds: new Set(
          (checks.data ?? []).filter((c) => c.checked).map((c) => c.meal_item_id as string),
        ),
        customFoods: (customs.data ?? []) as CustomFoodRow[],
      };
    },
  });

  /** Optimistic — the checkbox must feel instant with a phone on gym wifi. */
  const toggleItem = useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const { error } = await supabase
        .from("meal_item_checks")
        .upsert(
          { user_id: user!.id, meal_item_id: itemId, log_date: date, checked },
          { onConflict: "meal_item_id,log_date" },
        );
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ itemId, checked }) => {
      await qc.cancelQueries({ queryKey: foodKeys.day(date) });
      const prev = qc.getQueryData<DayData>(foodKeys.day(date));
      if (prev) {
        const next = new Set(prev.checkedIds);
        if (checked) next.add(itemId);
        else next.delete(itemId);
        qc.setQueryData<DayData>(foodKeys.day(date), { ...prev, checkedIds: next });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(foodKeys.day(date), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: foodKeys.day(date) }),
  });

  /**
   * Edits the plan itself, not one day. The meals stay fixed; what they are worth is
   * whatever the pack says, and packs get reformulated.
   */
  const updateMealItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<MealItemRow> }) => {
      const { error } = await supabase.from("meal_items").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidateTemplate,
  });

  /** Archived, not deleted — the row stays for any day that already ticked it. */
  const removeMealItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("meal_items").update({ archived: true }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidateTemplate,
  });

  const addCustomFood = useMutation({
    mutationFn: async (food: Omit<CustomFoodRow, "id" | "user_id" | "log_date" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("custom_foods")
        .insert({ ...food, user_id: user!.id, log_date: date });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: foodKeys.day(date) }),
  });

  const updateCustomFood = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<CustomFoodRow> }) => {
      const { error } = await supabase.from("custom_foods").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: foodKeys.day(date) }),
  });

  const deleteCustomFood = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_foods").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: foodKeys.day(date) });
      const prev = qc.getQueryData<DayData>(foodKeys.day(date));
      if (prev) {
        qc.setQueryData<DayData>(foodKeys.day(date), {
          ...prev, customFoods: prev.customFoods.filter((f) => f.id !== id),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(foodKeys.day(date), ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: foodKeys.day(date) }),
  });

  const checkedIds = day.data?.checkedIds ?? new Set<string>();
  const customFoods = day.data?.customFoods ?? [];

  const meals: MealWithItems[] = (template.data ?? []).map((m) => ({
    ...m,
    items: m.items.map((i) => ({ ...i, checked: checkedIds.has(i.id) })),
  }));

  const eatenSources = [
    ...meals.flatMap((m) => m.items.filter((i) => i.checked)),
    ...customFoods,
  ];
  const eaten: Macros = sumMacros(eatenSources);
  const planned: Macros = sumMacros(meals.flatMap((m) => m.items));

  return {
    meals,
    customFoods,
    eaten,
    planned,
    isLoading: template.isPending || day.isPending,
    toggleItem,
    updateMealItem,
    removeMealItem,
    addCustomFood,
    updateCustomFood,
    deleteCustomFood,
  };
}
