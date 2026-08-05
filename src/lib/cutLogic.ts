/**
 * The cut engine. Pure functions, no React, no Supabase — so the rules can be
 * unit-tested and reused later by an edge function or the AI coach.
 *
 * The rule, as written in the plan:
 *   - Weigh in daily. Average each 7-day week.
 *   - Compare this week's average with last week's.
 *   - Delta >= 0.15 kg  → progress → hold.
 *   - Delta <  0.15 kg  → plateau → take the next rung of the ladder.
 *   - Weeks 1–2 are water and glycogen noise. Judge nothing before week 3.
 *   - Hold every rung at least 14 days before re-evaluating.
 */
import { LADDER, type LadderRung } from "@/constants/plan";
import { daysBetween, shiftISO, weekRange, type ISODate } from "./date";
import { mean, round } from "./utils";
import type { PhaseRow, PlanStepRow } from "@/types/database";
import type { DayTarget, WeekSummary } from "@/types/domain";

export interface WeightPoint {
  date: ISODate;
  weightKg: number;
}

/** Resolve the calorie/cardio target in force on a given day. */
export function targetForDate(
  date: ISODate,
  phase: PhaseRow,
  steps: PlanStepRow[],
): DayTarget {
  const applicable = steps
    .filter((s) => s.effective_date <= date)
    .sort((a, b) => (a.effective_date < b.effective_date ? 1 : -1))[0];

  if (!applicable) {
    return {
      kcal: phase.base_kcal,
      cardioKcal: 0,
      stepIndex: 0,
      kind: "baseline",
      since: phase.start_date,
      reason: null,
    };
  }
  return {
    kcal: applicable.kcal_target,
    cardioKcal: applicable.cardio_kcal,
    stepIndex: applicable.step_index,
    kind: applicable.kind,
    since: applicable.effective_date,
    reason: applicable.reason,
  };
}

export const nextRung = (currentIndex: number): LadderRung | null =>
  LADDER[currentIndex + 1] ?? null;

function classify(delta: number | null, weekNumber: number, graceWeeks: number, threshold: number): WeekSummary["status"] {
  if (weekNumber <= graceWeeks) return "baseline";
  if (delta === null) return "pending";
  if (delta >= 0.3) return "strong";
  if (delta >= threshold) return "progress";
  return "plateau";
}

/**
 * Build one summary per completed-or-in-progress week of the phase.
 * A week with fewer than 4 logged days still reports an average, but is
 * marked "pending" so the ladder never fires on thin data.
 */
export function buildWeekSummaries(
  phase: PhaseRow,
  weights: WeightPoint[],
  steps: PlanStepRow[],
  today: ISODate,
): WeekSummary[] {
  const byDate = new Map(weights.map((w) => [w.date, w.weightKg]));
  const out: WeekSummary[] = [];
  let previousAvg: number | null = null;

  for (let week = 1; week <= phase.duration_weeks; week++) {
    const { start, end, label } = weekRange(phase.start_date, week);
    if (start > today) break;

    const entries: WeightPoint[] = [];
    for (let i = 0; i < 7; i++) {
      const day = shiftISO(start, i);
      const kg = byDate.get(day);
      if (kg != null) entries.push({ date: day, weightKg: kg });
    }

    const avgRaw = mean(entries.map((e) => e.weightKg));
    const average = avgRaw == null ? null : round(avgRaw, 2);
    const delta = average != null && previousAvg != null ? round(previousAvg - average, 2) : null;

    const enoughData = entries.length >= 4;
    const target = targetForDate(end > today ? today : end, phase, steps);

    out.push({
      weekNumber: week,
      startDate: start,
      endDate: end,
      label,
      entries: entries.map((e) => ({ date: e.date, weightKg: e.weightKg })),
      average,
      delta,
      status: enoughData
        ? classify(delta, week, phase.grace_weeks, Number(phase.plateau_threshold_kg))
        : "pending",
      kcalTarget: target.kcal,
      cardioKcal: target.cardioKcal,
    });

    if (average != null) previousAvg = average;
  }
  return out;
}

export interface Recommendation {
  shouldStep: boolean;
  rung: LadderRung | null;
  headline: string;
  /** the plain-English chain of reasoning, one clause per line */
  because: string[];
  blockedBy?: "grace-period" | "min-hold" | "thin-data" | "ladder-complete" | "no-plateau";
}

/**
 * Decide whether the next rung is due. Every branch returns its reasoning —
 * the coach must always be able to say why.
 */
export function evaluateNextStep(
  phase: PhaseRow,
  weeks: WeekSummary[],
  currentTarget: DayTarget,
  today: ISODate,
): Recommendation {
  const latest = weeks[weeks.length - 1];
  const hold = () => ({ shouldStep: false, rung: null } as const);

  if (!latest) {
    return { ...hold(), headline: "Not enough data yet", because: ["No weigh-ins logged for this phase yet."], blockedBy: "thin-data" };
  }

  if (latest.weekNumber <= phase.grace_weeks) {
    return {
      ...hold(),
      headline: `Week ${latest.weekNumber} is still settling`,
      because: [
        `Weeks 1–${phase.grace_weeks} move mostly on water and glycogen, not fat.`,
        "The decision rule only starts from week " + (phase.grace_weeks + 1) + ".",
      ],
      blockedBy: "grace-period",
    };
  }

  if (latest.status === "pending") {
    return {
      ...hold(),
      headline: "Week is still filling up",
      because: [
        `Only ${latest.entries.length} of 7 mornings logged this week.`,
        "A weekly average needs at least 4 days before it means anything.",
      ],
      blockedBy: "thin-data",
    };
  }

  const daysOnRung = daysBetween(currentTarget.since, today);
  if (daysOnRung < phase.min_hold_days) {
    return {
      ...hold(),
      headline: `Hold this step for ${phase.min_hold_days - daysOnRung} more day${phase.min_hold_days - daysOnRung === 1 ? "" : "s"}`,
      because: [
        `You've been at ${currentTarget.kcal} kcal${currentTarget.cardioKcal ? ` + ${currentTarget.cardioKcal} kcal cardio` : ""} for ${daysOnRung} days.`,
        `Every rung holds for ${phase.min_hold_days} days so the change has time to show.`,
      ],
      blockedBy: "min-hold",
    };
  }

  if (latest.status !== "plateau") {
    return {
      ...hold(),
      headline: "On track — change nothing",
      because: [
        `Week ${latest.weekNumber} averaged ${latest.average?.toFixed(2)} kg, down ${latest.delta?.toFixed(2)} kg on last week.`,
        `That clears the ${Number(phase.plateau_threshold_kg).toFixed(2)} kg threshold, so the current plan is still working.`,
        "Never cut more than you need to.",
      ],
      blockedBy: "no-plateau",
    };
  }

  const rung = nextRung(currentTarget.stepIndex);
  if (!rung) {
    return {
      ...hold(),
      headline: "Ladder complete — hold here",
      because: [
        "You're at the last rung: calorie floor and cardio ceiling both reached.",
        "Going further means eating into muscle. Reassess the phase instead of the deficit.",
      ],
      blockedBy: "ladder-complete",
    };
  }

  const isDiet = rung.kind === "diet";
  return {
    shouldStep: true,
    rung,
    headline: isDiet
      ? `Drop to ${rung.kcal.toLocaleString()} kcal`
      : `Add cardio — ${rung.cardioKcal} kcal total`,
    because: [
      `Week ${latest.weekNumber} averaged ${latest.average?.toFixed(2)} kg against ${(latest.average! + (latest.delta ?? 0)).toFixed(2)} kg the week before.`,
      `That's a ${latest.delta?.toFixed(2)} kg drop — under the ${Number(phase.plateau_threshold_kg).toFixed(2)} kg threshold, so this counts as a plateau.`,
      `You've held ${currentTarget.kcal} kcal${currentTarget.cardioKcal ? ` + ${currentTarget.cardioKcal} kcal cardio` : ""} for ${daysOnRung} days, past the ${phase.min_hold_days}-day minimum.`,
      `The ladder alternates diet and cardio, and the last change was ${currentTarget.kind === "cardio" ? "cardio" : "diet"} — so this one is ${isDiet ? "diet" : "cardio"}.`,
      rung.detail,
    ],
  };
}
