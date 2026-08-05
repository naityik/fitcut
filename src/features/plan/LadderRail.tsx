import { motion } from "framer-motion";
import { Check, Flame, Footprints } from "lucide-react";
import { LADDER } from "@/constants/plan";
import { cn } from "@/lib/utils";
import { cardioKmForKcal } from "@/lib/nutrition";

/**
 * The signature element. The plan is a staircase, so the UI is a staircase:
 * each rung steps further right, and you can always see how many are left.
 */
export function LadderRail({
  currentIndex, bodyweightKg, compact = false,
}: { currentIndex: number; bodyweightKg: number | null; compact?: boolean }) {
  return (
    <ol className={cn("space-y-1", compact && "space-y-0.5")}>
      {LADDER.map((rung) => {
        const done = rung.index < currentIndex;
        const current = rung.index === currentIndex;
        const km = rung.cardioKcal > 0 ? cardioKmForKcal(rung.cardioKcal, bodyweightKg) : null;

        return (
          <motion.li
            key={rung.index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: rung.index * 0.03 }}
            style={{ paddingLeft: rung.index * (compact ? 8 : 14) }}
            className="flex items-center gap-2.5"
          >
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-bold",
                current ? "bg-jade text-white" : done ? "bg-jade/12 text-jade" : "bg-ink/[0.05] text-faint",
              )}
            >
              {done ? <Check className="h-3 w-3" strokeWidth={3} /> : rung.index}
            </span>

            <div className={cn("h-px flex-1", current ? "bg-jade/30" : "bg-line")} />

            <span
              className={cn(
                "tnum shrink-0 text-[13px] font-bold",
                current ? "text-ink" : done ? "text-muted" : "text-faint",
              )}
            >
              {rung.kcal.toLocaleString()}
            </span>

            {rung.cardioKcal > 0 && (
              <span
                className={cn(
                  "tnum inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold",
                  current ? "text-cardio" : "text-faint",
                )}
              >
                <Footprints className="h-3 w-3" />
                {km ? `${km} km` : `+${rung.cardioKcal}`}
              </span>
            )}

            {current && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-jade/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-jade">
                <Flame className="h-2.5 w-2.5" /> Now
              </span>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}
