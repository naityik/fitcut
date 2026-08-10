import * as React from "react";
import { Check, ChevronRight, ExternalLink, RotateCcw } from "lucide-react";
import { Card, CardBody, SectionLabel } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { RichText } from "./RichText";
import { PosteriorCurve, posteriorStat } from "./PosteriorCurve";
import { useLearnProgress } from "./useLearnProgress";
import {
  LEARN_DELIVERABLE, LEARN_FOOTNOTE, LEARN_LIBRARY, LEARN_META, LEARN_PLAN,
  type LearnDay,
} from "@/constants/learnPlan";
import { daysBetween, fmtDayLong, todayISO, type ISODate } from "@/lib/date";
import { cn } from "@/lib/utils";

type DayState = "done" | "today" | "overdue" | "ahead";

const ALL_DAYS: LearnDay[] = LEARN_PLAN.flatMap((w) => w.days);

export function LearnPage() {
  const { done, isLoading, toggleDay, clearAll } = useLearnProgress();
  const today = todayISO();

  const [open, setOpen] = React.useState<Set<ISODate>>(new Set());
  const [openedToday, setOpenedToday] = React.useState(false);

  // Today's card opens itself once, on first load — the plan is a daily object, and the
  // day you are on is the only one you almost certainly want.
  React.useEffect(() => {
    if (openedToday || isLoading) return;
    if (ALL_DAYS.some((d) => d.date === today)) setOpen(new Set([today]));
    setOpenedToday(true);
  }, [openedToday, isLoading, today]);

  const total = ALL_DAYS.length;
  const completed = ALL_DAYS.filter((d) => done.has(d.date)).length;
  const fraction = total ? completed / total : 0;

  /**
   * Pace, not just progress. Elapsed days are capped at the plan length so the last day
   * cannot report you as behind by more than the plan contains.
   */
  const elapsed = Math.min(Math.max(daysBetween(LEARN_META.start, today) + 1, 0), total);
  const drift = completed - elapsed;

  const toggle = (date: ISODate) =>
    toggleDay.mutate({ date, done: !done.has(date) });

  const toggleOpen = (date: ISODate) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const allOpen = open.size >= total;
  const toggleAll = () =>
    setOpen(allOpen ? new Set<ISODate>() : new Set(ALL_DAYS.map((d) => d.date)));

  const stateOf = (day: LearnDay): DayState => {
    if (done.has(day.date)) return "done";
    if (day.date === today) return "today";
    return day.date < today ? "overdue" : "ahead";
  };

  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <p className="eyebrow">
          21 days · {fmtDayLong(LEARN_META.start)} → {fmtDayLong(LEARN_META.end)} ·{" "}
          {LEARN_META.hoursPerDay}
        </p>
        <h1 className="mt-2 max-w-[18ch] font-display text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-[38px]">
          From Bayes to <em className="italic text-protein">simulation-based inference</em>
        </h1>
        <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-muted">
          {LEARN_META.lede}
        </p>
      </header>

      {/* The signature: readiness as a posterior that sharpens with evidence */}
      <Card>
        <CardBody>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-3">
            <SectionLabel className="mb-0">Posterior over “ready on 1 Sept”</SectionLabel>
            <span className="tnum text-[12px] text-muted">
              {posteriorStat(completed, total)}
            </span>
          </div>
          <PosteriorCurve fraction={fraction} />
        </CardBody>
      </Card>

      {/* Progress + pace */}
      <Card className="mt-3">
        <CardBody>
          <div className="flex items-center gap-3">
            <span className="tnum shrink-0 font-display text-[15px] font-bold">
              {completed} <span className="text-faint">/ {total}</span>
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-protein transition-[width] duration-500"
                style={{ width: `${fraction * 100}%` }}
              />
            </div>
            {completed > 0 && (
              <Button
                variant="secondary" size="sm"
                onClick={() => clearAll.mutate()}
                aria-label="Clear all progress"
              >
                <RotateCcw className="h-3 w-3" /> Clear
              </Button>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {completed >= total ? (
              <Badge tone="progress">Plan complete</Badge>
            ) : drift > 0 ? (
              <Badge tone="progress">{drift} day{drift === 1 ? "" : "s"} ahead</Badge>
            ) : drift < 0 ? (
              <Badge tone="plateau">{-drift} day{drift === -1 ? "" : "s"} behind</Badge>
            ) : (
              <Badge tone="jade">On pace</Badge>
            )}
            <span className="text-[12px] text-muted">
              Day {Math.max(elapsed, 0)} of {total} · {total - completed} left to build
            </span>
            <button
              onClick={toggleAll}
              className="ml-auto text-[12px] font-semibold text-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        LEARN_PLAN.map((week) => (
          <section key={week.tag} className="mt-9">
            <div className="border-t-2 border-ink pt-3">
              <span className="eyebrow text-protein">{week.tag}</span>
              <h2 className="mt-1 font-display text-[22px] font-bold tracking-[-0.02em]">
                {week.title}
              </h2>
              <p className="mt-1.5 max-w-[60ch] text-[14px] leading-relaxed text-muted">
                {week.note}
              </p>
            </div>

            <div className="mt-3 space-y-2.5">
              {week.days.map((day) => (
                <DayCard
                  key={day.date}
                  day={day}
                  state={stateOf(day)}
                  isOpen={open.has(day.date)}
                  onToggleOpen={() => toggleOpen(day.date)}
                  onToggleDone={() => toggle(day.date)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      {/* Deliverable */}
      <Card className="mt-9 border-ink bg-ink">
        <CardBody>
          <h2 className="font-display text-[20px] font-bold tracking-[-0.02em] text-white">
            {LEARN_DELIVERABLE.title}
          </h2>
          <p className="mt-1.5 max-w-[58ch] text-[14px] leading-relaxed text-white/55">
            {LEARN_DELIVERABLE.lede}
          </p>
          <ol className="mt-3.5 list-decimal space-y-1.5 pl-5 text-[14px] leading-relaxed text-white/80 marker:text-white/40">
            {LEARN_DELIVERABLE.items.map((item) => (
              <li key={item}>
                <RichText>{item}</RichText>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      {/* Library */}
      <section className="mt-9">
        <div className="border-t-2 border-ink pt-3">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">Resource library</h2>
          <p className="mt-1 text-[14px] text-muted">
            Everything referenced above, grouped by what it's for. Videos first, since that's how
            you learn fastest.
          </p>
        </div>

        {LEARN_LIBRARY.map((group) => (
          <div key={group.heading} className="mt-5">
            <p className="eyebrow mb-2 text-protein">{group.heading}</p>
            <ul className="space-y-0">
              {group.entries.map((entry) => (
                <li key={entry.href + entry.title} className="border-b border-line py-2.5">
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-start gap-1.5 text-[14px] font-medium text-ink decoration-protein underline-offset-4 hover:text-protein hover:underline"
                  >
                    {entry.title}
                    <ExternalLink className="mt-1 h-3 w-3 shrink-0 text-faint group-hover:text-protein" />
                  </a>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">
                    <RichText>{entry.why}</RichText>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <p className="mt-8 max-w-[62ch] border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
        {LEARN_FOOTNOTE} Progress saves to your account as you tick, so it follows you between
        devices.
      </p>
    </div>
  );
}

function DayCard({
  day, state, isOpen, onToggleOpen, onToggleDone,
}: {
  day: LearnDay;
  state: DayState;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleDone: () => void;
}) {
  const done = state === "done";

  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        done && "border-progress/40 bg-progress/[0.02]",
        state === "today" && "border-protein ring-[3px] ring-protein/15",
        state === "overdue" && "border-plateau/40",
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <button
          onClick={onToggleDone}
          aria-pressed={done}
          aria-label={`Mark ${day.title} complete`}
          className={cn(
            "mt-0.5 grid h-[21px] w-[21px] shrink-0 place-items-center rounded-md border-2 transition-colors",
            done ? "border-progress bg-progress text-white" : "border-line hover:border-muted",
          )}
        >
          {done && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </button>

        <button
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "text-[10.5px] font-semibold uppercase tracking-[0.1em]",
                state === "today" ? "text-protein" : "text-faint",
              )}
            >
              {fmtDayLong(day.date)}
            </span>
            {state === "today" && <Badge tone="protein">Today</Badge>}
            {state === "overdue" && <Badge tone="plateau">Missed</Badge>}
          </span>
          <span
            className={cn(
              "mt-0.5 block text-[15px] font-semibold tracking-[-0.005em]",
              done && "text-muted line-through",
            )}
          >
            {day.title}
          </span>
        </button>

        <button
          onClick={onToggleOpen}
          aria-label={isOpen ? "Collapse" : "Expand"}
          className="mt-0.5 shrink-0 rounded-lg p-1 text-faint transition-colors hover:bg-ink/[0.05] hover:text-ink"
        >
          <ChevronRight className={cn("h-4 w-4 transition-transform", isOpen && "rotate-90")} />
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-line px-4 pb-4 pt-3.5 sm:pl-[52px]">
          {day.resources.length > 0 && (
            <div className="mb-4">
              <SectionLabel>Watch &amp; read</SectionLabel>
              <ul className="space-y-1">
                {day.resources.map((r) => (
                  <li key={r.href + r.title} className="text-[14px]">
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink decoration-protein underline-offset-4 hover:text-protein hover:underline"
                    >
                      {r.title}
                    </a>
                    <span className="tnum ml-2 text-[11.5px] text-faint">{r.duration}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <SectionLabel>Build</SectionLabel>
          <div className="rounded-xl border border-line border-l-[3px] border-l-protein bg-surface p-3.5">
            <p className="text-[14px] leading-relaxed">
              <RichText>{day.buildIntro}</RichText>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[14px] leading-relaxed marker:text-faint">
              {day.buildSteps.map((step) => (
                <li key={step}>
                  <RichText>{step}</RichText>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3.5 border-t border-dotted border-line pt-3">
            <SectionLabel>By tonight you can say</SectionLabel>
            <p className="font-display text-[15px] italic leading-relaxed">
              <RichText>{day.claim}</RichText>
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
