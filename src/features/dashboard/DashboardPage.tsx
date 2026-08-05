import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight, Dumbbell, Footprints, Info, Scale, TrendingDown, UtensilsCrossed,
} from "lucide-react";
import { Card, CardBody, SectionLabel } from "@/components/ui/card";
import { Badge, Stat } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { MacroBar, ProgressRing } from "@/components/charts/ProgressRing";
import { DateBar } from "@/components/layout/DateBar";
import { LadderRail } from "@/features/plan/LadderRail";
import { usePhase } from "@/features/plan/PhaseProvider";
import { useFoodDay } from "@/features/food/useFoodDay";
import { useWeights } from "@/features/weight/useWeight";
import { useWorkoutDay } from "@/features/workout/useWorkout";
import { WeightQuickLog } from "@/features/weight/WeightQuickLog";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { cardioKmForKcal } from "@/lib/nutrition";
import { fmtInt, pct, round } from "@/lib/utils";
import { phaseWeekNumber } from "@/lib/date";

export function DashboardPage() {
  const { date } = useSelectedDate();
  const { phase, targetFor } = usePhase();
  const target = targetFor(date);
  const food = useFoodDay(date);
  const weights = useWeights();
  const workout = useWorkoutDay(date);

  const kcalLeft = target.kcal - food.eaten.kcal;
  const proteinLeft = phase.protein_target_g - food.eaten.protein;
  const week = phaseWeekNumber(date, phase.start_date, phase.duration_weeks);
  const weekSummary = weights.weeks.find((w) => w.weekNumber === week) ?? null;
  const bodyweight = weights.latest?.weightKg ?? phase.starting_weight_kg ?? null;
  const cardioKm = cardioKmForKcal(target.cardioKcal, bodyweight);

  return (
    <div className="animate-fade-up">
      <DateBar title="Today" />

      {/* Calories + macros */}
      <Card className="overflow-hidden">
        <CardBody className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ProgressRing value={pct(food.eaten.kcal, target.kcal)} size={148} stroke={12}>
            <span className="tnum font-display text-[34px] font-extrabold leading-none">
              {fmtInt(Math.max(kcalLeft, 0))}
            </span>
            <span className="eyebrow mt-1.5">kcal left</span>
            <span className="mt-1 text-[11px] text-faint">
              {fmtInt(food.eaten.kcal)} of {fmtInt(target.kcal)}
            </span>
          </ProgressRing>

          <div className="w-full flex-1 space-y-3.5">
            <MacroRow label="Protein" eaten={food.eaten.protein} target={phase.protein_target_g} color="hsl(var(--protein))" />
            <MacroRow label="Carbs" eaten={food.eaten.carbs} target={phase.carbs_target_g} color="hsl(var(--carbs))" />
            <MacroRow label="Fat" eaten={food.eaten.fat} target={phase.fat_target_g} color="hsl(var(--fat))" />

            <div className="flex items-center justify-between border-t border-line pt-3">
              <span className="text-[12px] text-muted">
                {proteinLeft > 0
                  ? `${round(proteinLeft, 0)} g of protein still to go`
                  : "Protein target hit"}
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link to={`/food?d=${date}`}>
                  Log food <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Today's three jobs */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <QuickCard
          to={`/weight?d=${date}`}
          icon={<Scale className="h-4 w-4" />}
          label="Morning weight"
          value={weights.byDate.get(date)?.toFixed(2) ?? "—"}
          unit="kg"
          hint={weekSummary?.average ? `Week avg ${weekSummary.average.toFixed(2)}` : "Not logged yet"}
        />
        <QuickCard
          to={`/workout?d=${date}`}
          icon={<Dumbbell className="h-4 w-4" />}
          label="Workout"
          value={workout.workout ? workout.workout.split : "Rest"}
          unit={workout.workout ? `${workout.logged.length} lifts` : ""}
          hint={workout.workout ? "Tap to keep logging" : "Pick a split when you get there"}
          capitalize
        />
        <QuickCard
          to="/weight"
          icon={<Footprints className="h-4 w-4" />}
          label="Cardio target"
          value={target.cardioKcal > 0 ? String(target.cardioKcal) : "None"}
          unit={target.cardioKcal > 0 ? "kcal" : ""}
          hint={cardioKm ? `≈ ${cardioKm} km run` : "No runs at this rung"}
        />
      </div>

      {/* Weigh-in, inline so it takes one tap from the home screen */}
      <div className="mt-3">
        <WeightQuickLog date={date} />
      </div>

      {/* Coach */}
      <Card className="mt-3">
        <CardBody>
          <div className="flex items-start justify-between gap-3">
            <div>
              <SectionLabel>What the numbers say</SectionLabel>
              <h3 className="font-display text-[17px] font-bold tracking-[-0.01em]">
                {weights.recommendation.headline}
              </h3>
            </div>
            {weights.recommendation.shouldStep ? (
              <Badge tone="plateau">Action due</Badge>
            ) : (
              <Badge tone={weights.recommendation.blockedBy === "no-plateau" ? "progress" : "neutral"}>
                {weights.recommendation.blockedBy === "no-plateau" ? "On track" : "Holding"}
              </Badge>
            )}
          </div>

          <ul className="mt-3 space-y-1.5">
            {weights.recommendation.because.map((line, i) => (
              <motion.li
                key={line}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="flex gap-2.5 text-[13px] leading-relaxed text-muted"
              >
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-faint" />
                {line}
              </motion.li>
            ))}
          </ul>

          <p className="mt-3.5 flex items-start gap-2 rounded-xl bg-sunken px-3 py-2.5 text-[12px] leading-relaxed text-muted">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" />
            Recommendations come from the rule you wrote: compare weekly averages, act only on a
            confirmed plateau, hold every change for {phase.min_hold_days} days.
          </p>
        </CardBody>
      </Card>

      {/* Ladder */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Card>
          <CardBody>
            <SectionLabel>Where you are on the ladder</SectionLabel>
            <LadderRail currentIndex={target.stepIndex} bodyweightKg={bodyweight} />
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex h-full flex-col">
            <SectionLabel>This week</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Stat
                value={weekSummary?.average?.toFixed(2) ?? "—"}
                label="7-day avg"
                sub={`${weekSummary?.entries.length ?? 0} of 7 logged`}
              />
              <Stat
                value={
                  weekSummary?.delta != null
                    ? `${weekSummary.delta >= 0 ? "−" : "+"}${Math.abs(weekSummary.delta).toFixed(2)}`
                    : "—"
                }
                label="vs last week"
                sub="kg change"
                tone={
                  weekSummary?.status === "plateau"
                    ? "hsl(var(--plateau))"
                    : weekSummary?.delta != null && weekSummary.delta > 0
                      ? "hsl(var(--progress))"
                      : undefined
                }
              />
            </div>
            <div className="mt-auto pt-4">
              <Button asChild variant="secondary" size="sm" className="w-full">
                <Link to="/weight">
                  <TrendingDown className="h-3.5 w-3.5" /> Full weight history
                </Link>
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <Button asChild variant="ghost" size="sm" className="mx-auto mt-4 flex">
        <Link to={`/food?d=${date}`}>
          <UtensilsCrossed className="h-3.5 w-3.5" /> Jump to today's meals
        </Link>
      </Button>
    </div>
  );
}

function MacroRow({
  label, eaten, target, color,
}: { label: string; eaten: number; target: number; color: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="tnum text-[12px] text-muted">
          <span className="font-semibold text-ink">{round(eaten, 0)}</span> / {target} g
        </span>
      </div>
      <MacroBar value={pct(eaten, target)} color={color} />
    </div>
  );
}

function QuickCard({
  to, icon, label, value, unit, hint, capitalize,
}: {
  to: string; icon: ReactNode; label: string;
  value: string; unit?: string; hint: string; capitalize?: boolean;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-line bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="flex items-center gap-2 text-faint">
        {icon}
        <span className="eyebrow">{label}</span>
      </div>
      <p className="mt-2.5 flex items-baseline gap-1.5">
        <span className={`tnum font-display text-[24px] font-extrabold leading-none ${capitalize ? "capitalize" : ""}`}>
          {value}
        </span>
        {unit && <span className="text-[12px] font-medium text-faint">{unit}</span>}
      </p>
      <p className="mt-1.5 text-[11px] text-muted">{hint}</p>
    </Link>
  );
}
