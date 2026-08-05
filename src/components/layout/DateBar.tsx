import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelectedDate } from "@/hooks/useSelectedDate";
import { usePhase } from "@/features/plan/PhaseProvider";
import { phaseDayNumber, relativeDayLabel, todayISO } from "@/lib/date";

/**
 * Every logging screen shares this. Moving off today is the whole edit-the-past
 * story — there is no separate "edit yesterday" mode.
 */
export function DateBar({ title }: { title: string }) {
  const { date, setDate, isToday, goPrev, goNext, goToday } = useSelectedDate();
  const { phase, window: win } = usePhase();
  const dayNumber = phaseDayNumber(date, phase.start_date);
  const inPhase = dayNumber >= 1 && dayNumber <= win.totalDays;

  return (
    <header className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">
            {inPhase ? `Day ${dayNumber} of ${win.totalDays}` : "Outside the phase"}
          </p>
          <h1 className="mt-1 truncate font-display text-[26px] font-extrabold leading-none tracking-[-0.03em]">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-surface p-1 shadow-card">
          <button onClick={goPrev} aria-label="Previous day"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-ink/5 hover:text-ink">
            <ChevronLeft className="h-4 w-4" strokeWidth={2.4} />
          </button>
          <label className="relative flex cursor-pointer items-center gap-1.5 px-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-faint" />
            <span className={cn("text-[13px] font-semibold", isToday ? "text-ink" : "text-jade")}>
              {relativeDayLabel(date)}
            </span>
            <input
              type="date" value={date} max={win.end} min={win.start}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Pick a date"
            />
          </label>
          <button onClick={goNext} aria-label="Next day" disabled={date >= win.end}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30">
            <ChevronRight className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>
      </div>

      {!isToday && (
        <button
          onClick={goToday}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-jade/8 px-2.5 py-1 text-[12px] font-semibold text-jade transition-colors hover:bg-jade/12"
        >
          Editing {date < todayISO() ? "a past day" : "a future day"} · back to today
        </button>
      )}
    </header>
  );
}
