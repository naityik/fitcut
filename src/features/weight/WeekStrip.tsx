import { TIER_COLOR } from "@/constants/plan";
import type { WeekSummary } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * Calorie tier per week across the whole phase, carried over from the original
 * plan sketch. Cardio weeks get a marker above the block.
 */
export function WeekStrip({
  weeks, totalWeeks, currentWeek,
}: { weeks: WeekSummary[]; totalWeeks: number; currentWeek: number | null }) {
  const cells = Array.from({ length: totalWeeks }, (_, i) => weeks.find((w) => w.weekNumber === i + 1) ?? null);

  return (
    <div>
      <div className="flex items-end gap-[3px]">
        {cells.map((w, i) => {
          const isCurrent = currentWeek === i + 1;
          return (
            <div key={i} className="min-w-0 flex-1">
              <div className="mb-1 h-2 text-center">
                {w && w.cardioKcal > 0 && (
                  <span className="text-[7px] leading-none text-cardio">▲</span>
                )}
              </div>
              <div
                className={cn("h-5 rounded-[3px] transition-all", isCurrent && "ring-2 ring-ink/70 ring-offset-1 ring-offset-surface")}
                style={{
                  background: w ? (TIER_COLOR[w.kcalTarget] ?? "hsl(var(--jade))") : "hsl(var(--line))",
                  opacity: w ? (w.cardioKcal > 0 ? 1 : 0.72) : 1,
                }}
                title={w ? `Week ${w.weekNumber} · ${w.kcalTarget} kcal` : `Week ${i + 1}`}
              />
              <div className="mt-1 text-center text-[7px] text-faint">{i + 1}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1">
        {[2400, 2300, 2200, 2100].map((tier) => (
          <span key={tier} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: TIER_COLOR[tier] }} />
            <span className="text-[10px] text-muted">{tier.toLocaleString()}</span>
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="text-[8px] text-cardio">▲</span>
          <span className="text-[10px] text-muted">+ cardio</span>
        </span>
      </div>
    </div>
  );
}
