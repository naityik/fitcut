import { supabase } from "@/lib/supabase";

export interface FoodEstimate {
  name: string;
  portion: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  note: string;
}

export class EstimatorUnavailable extends Error {}

/**
 * Calls the `estimate-food` edge function, which holds the Anthropic key
 * server-side. The key never reaches the browser.
 *
 * Callers must handle EstimatorUnavailable by falling back to manual entry —
 * a missing estimator should never block logging a meal.
 */
export async function estimateFood(description: string): Promise<FoodEstimate> {
  const { data, error } = await supabase.functions.invoke<FoodEstimate>("estimate-food", {
    body: { description },
  });

  if (error) throw new EstimatorUnavailable(error.message);
  if (!data || typeof data.kcal !== "number") {
    throw new EstimatorUnavailable("The estimator returned an unexpected response.");
  }

  return {
    name: data.name || description,
    portion: data.portion ?? "",
    kcal: Math.max(0, Math.round(data.kcal)),
    protein_g: Math.max(0, Math.round(data.protein_g * 10) / 10),
    carbs_g: Math.max(0, Math.round(data.carbs_g * 10) / 10),
    fat_g: Math.max(0, Math.round(data.fat_g * 10) / 10),
    note: data.note ?? "",
  };
}
