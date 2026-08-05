/**
 * All dates crossing the DB boundary are plain `yyyy-MM-dd` strings in the
 * user's local timezone. Never `new Date().toISOString()` — that shifts the day
 * for anyone east or west of UTC, which for a 5:30am weigh-in is exactly wrong.
 */
import {
  addDays, differenceInCalendarDays, format, isValid, parseISO, startOfDay,
} from "date-fns";

export type ISODate = string;

export const toISO = (d: Date): ISODate => format(d, "yyyy-MM-dd");
export const fromISO = (s: ISODate): Date => startOfDay(parseISO(s));
export const todayISO = (): ISODate => toISO(new Date());
export const isValidISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && isValid(parseISO(s));

export const shiftISO = (s: ISODate, days: number): ISODate => toISO(addDays(fromISO(s), days));
export const daysBetween = (a: ISODate, b: ISODate) => differenceInCalendarDays(fromISO(b), fromISO(a));

/** "Wed 5 Aug" */
export const fmtDayLong = (s: ISODate) => format(fromISO(s), "EEE d MMM");
/** "5 Aug" */
export const fmtDayShort = (s: ISODate) => format(fromISO(s), "d MMM");
/** "Wed" */
export const fmtWeekday = (s: ISODate) => format(fromISO(s), "EEE");

export function relativeDayLabel(s: ISODate, today = todayISO()): string {
  const diff = daysBetween(today, s);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  return fmtDayLong(s);
}

// ---------------------------------------------------------------------------
// Phase maths. Weeks run from the phase start weekday, so a phase beginning on
// a Wednesday has Wed→Tue weeks. That matches how the plan was written.
// ---------------------------------------------------------------------------

export interface PhaseWindow {
  start: ISODate;
  end: ISODate;
  totalDays: number;
  weeks: number;
}

export function phaseWindow(start: ISODate, durationWeeks: number): PhaseWindow {
  const totalDays = durationWeeks * 7;
  return { start, end: shiftISO(start, totalDays - 1), totalDays, weeks: durationWeeks };
}

/** 1-based day number within the phase. 0 if before, > totalDays if after. */
export const phaseDayNumber = (date: ISODate, start: ISODate) => daysBetween(start, date) + 1;

/** 1-based week number. Returns null when the date sits outside the phase. */
export function phaseWeekNumber(date: ISODate, start: ISODate, durationWeeks: number): number | null {
  const day = phaseDayNumber(date, start);
  if (day < 1 || day > durationWeeks * 7) return null;
  return Math.ceil(day / 7);
}

export function weekRange(start: ISODate, weekNumber: number) {
  const s = shiftISO(start, (weekNumber - 1) * 7);
  const e = shiftISO(s, 6);
  return { start: s, end: e, label: `${fmtDayShort(s)} – ${fmtDayShort(e)}` };
}

export function eachDayInRange(start: ISODate, end: ISODate): ISODate[] {
  const out: ISODate[] = [];
  const n = daysBetween(start, end);
  for (let i = 0; i <= n; i++) out.push(shiftISO(start, i));
  return out;
}

export const clampToPhase = (date: ISODate, w: PhaseWindow): ISODate =>
  date < w.start ? w.start : date > w.end ? w.end : date;
