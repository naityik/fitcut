import * as React from "react";
import {
  Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ChevronDown, Footprints, TrendingDown } from "lucide-react";
import { Card, CardBody, SectionLabel } from "@/components/ui/card";
import { Badge, EmptyState, Stat } from "@/components/ui/primitives";
import { Sparkline } from "@/components/charts/Sparkline";
import { DateBar } from "@/components/layout/DateBar";
import { WeekStrip } from "./WeekStrip";
import { WeightQuickLog, WeighInProtocol } from "./WeightQuickLog";
import { useWeights } from "./useWeight";
import { usePhase } from "@/features/plan/PhaseProvider";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { TIER_COLOR } from "@/constants/plan";
import { fmtDayShort, fmtWeekday, phaseWeekNumber, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { WeekSummary } from "@/types/domain";

const STATUS: Record<WeekSummary["status"], { label: string; tone: "neutral" | "progress" | "plateau" }> = {
  pending: { label: "Filling up", tone: "neutral" },
  baseline: { label: "Settling", tone: "neutral" },
  progress: { label: "On track", tone: "progress" },
  strong: { label: "Strong", tone: "progress" },
  plateau: { label: "Plateau", tone: "plateau" },
};

export function WeightPage() {
  const { date } = useSelectedDate();
  const { phase } = usePhase();
  const w = useWeights();
  const currentWeekNo = phaseWeekNumber(todayISO(), phase.start_date, phase.duration_weeks);
  const [open, setOpen] = React.useState<number | null>(currentWeekNo);

  const chartData = w.weeks
    .filter((week) => week.average != null)
    .map((week) => ({
      name: `W${week.weekNumber}`,
      average: week.average,
      kcal: week.kcalTarget,
    }));

  const startWeight = w.startingWeight;
  const latest = w.latest?.weightKg ?? null;
  const totalDrop = startWeight != null && latest != null ? startWeight - latest : null;

  return (
    <div className="animate-fade-up">
      <DateBar title="Weight" />

      <WeightQuickLog date={date} />

      <div className="mt-3 grid grid-cols-3 gap-3">
        <Card><CardBody><Stat value={startWeight?.toFixed(2) ?? "—"} label="Start" sub="kg" /></CardBody></Card>
        <Card><CardBody><Stat value={latest?.toFixed(2) ?? "—"} label="Latest" sub="kg" /></CardBody></Card>
        <Card>
          <CardBody>
            <Stat
              value={totalDrop != null ? `${totalDrop >= 0 ? "−" : "+"}${Math.abs(totalDrop).toFixed(2)}` : "—"}
              label="Total"
              sub={w.avgLossPerWeek != null ? `${w.avgLossPerWeek.toFixed(2)} kg/week` : "kg"}
              tone={totalDrop != null && totalDrop > 0 ? "hsl(var(--progress))" : undefined}
            />
          </CardBody>
        </Card>
      </div>

      {/* Trend */}
      <Card className="mt-3">
        <CardBody>
          <SectionLabel>Weekly average trend</SectionLabel>
          {chartData.length < 2 ? (
            <EmptyState icon={<TrendingDown className="h-6 w-6" />} title="The trend needs two weeks">
              Log a morning weight each day. The graph draws itself once the second weekly average lands.
            </EmptyState>
          ) : (
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--jade))" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="hsl(var(--jade))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(var(--line))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--faint))" }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={["dataMin - 0.4", "dataMax + 0.4"]}
                    tick={{ fontSize: 10, fill: "hsl(var(--faint))" }}
                    tickLine={false} axisLine={false} width={46}
                    tickFormatter={(v: number) => v.toFixed(1)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12, border: "1px solid hsl(var(--line))",
                      boxShadow: "0 8px 30px -12px rgba(12,17,22,.25)", fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v.toFixed(2)} kg`, "7-day average"]}
                  />
                  <Area type="monotone" dataKey="average" stroke="none" fill="url(#wfill)" />
                  <Line type="monotone" dataKey="average" stroke="hsl(var(--jade))" strokeWidth={2.5}
                    dot={{ r: 3, fill: "hsl(var(--jade))" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Phase strip */}
      <Card className="mt-3">
        <CardBody>
          <SectionLabel>Calorie level by week</SectionLabel>
          <WeekStrip weeks={w.weeks} totalWeeks={phase.duration_weeks} currentWeek={currentWeekNo} />
        </CardBody>
      </Card>

      {/* Week cards */}
      <div className="mt-3 space-y-2.5">
        <SectionLabel>Week by week</SectionLabel>
        {w.weeks.length === 0 && (
          <EmptyState title="Nothing logged yet">
            Weeks appear here as the phase runs. The first entry starts the record.
          </EmptyState>
        )}
        {[...w.weeks].reverse().map((week) => (
          <WeekCard
            key={week.weekNumber}
            week={week}
            isOpen={open === week.weekNumber}
            onToggle={() => setOpen(open === week.weekNumber ? null : week.weekNumber)}
          />
        ))}
      </div>

      <div className="mt-3">
        <WeighInProtocol />
      </div>
    </div>
  );
}

function WeekCard({
  week, isOpen, onToggle,
}: { week: WeekSummary; isOpen: boolean; onToggle: () => void }) {
  const status = STATUS[week.status];
  const tier = TIER_COLOR[week.kcalTarget] ?? "hsl(var(--jade))";

  return (
    <Card className={cn(week.status === "plateau" && "border-plateau/30")}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <span
          className="tnum grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold"
          style={{ background: `color-mix(in srgb, ${tier} 12%, transparent)`, color: tier }}
        >
          W{week.weekNumber}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[13px] font-bold">{week.label}</span>
            <span
              className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: `color-mix(in srgb, ${tier} 14%, transparent)`, color: tier }}
            >
              {week.kcalTarget.toLocaleString()} kcal
            </span>
            {week.cardioKcal > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-cardio">
                <Footprints className="h-2.5 w-2.5" />+{week.cardioKcal}
              </span>
            )}
          </span>
          <span className="mt-1 flex items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            <span className="tnum text-[11px] text-muted">
              {week.delta != null
                ? `${week.delta >= 0 ? "−" : "+"}${Math.abs(week.delta).toFixed(2)} kg vs last week`
                : "first week of the phase"}
            </span>
          </span>
        </span>

        <span className="shrink-0 text-right">
          <span className="tnum block font-display text-[17px] font-extrabold leading-none">
            {week.average?.toFixed(2) ?? "—"}
          </span>
          <span className="mt-0.5 block text-[9px] uppercase tracking-wider text-faint">kg avg</span>
          <span className="mt-1.5 block">
            <Sparkline values={week.entries.map((e) => e.weightKg)} width={96} height={26} />
          </span>
        </span>

        <ChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="animate-fade-up px-4 pb-4">
          <div className="grid grid-cols-7 gap-1 border-t border-line pt-3">
            {Array.from({ length: 7 }, (_, i) => {
              const entry = week.entries[i];
              const iso = entry?.date;
              return (
                <div key={i} className="rounded-lg bg-sunken px-1 py-2 text-center">
                  <div className="text-[9px] font-bold text-faint">{iso ? fmtWeekday(iso) : "—"}</div>
                  <div className="text-[8px] text-faint">{iso ? fmtDayShort(iso) : ""}</div>
                  <div className="tnum mt-1 text-[13px] font-extrabold">
                    {entry ? entry.weightKg.toFixed(1) : "·"}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-sunken px-3 py-2.5">
            <span className="text-[12px] text-muted">7-day average</span>
            <span className="tnum text-[15px] font-extrabold">
              {week.average?.toFixed(2) ?? "—"} kg
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
