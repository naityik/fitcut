import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { isValidISO, shiftISO, todayISO, type ISODate } from "@/lib/date";

/**
 * The viewed day lives in the URL (?d=2026-08-14) so it survives navigation
 * between tabs, deep links and the browser back button. No day is ever locked —
 * this is the only gate on editing the past.
 */
export function useSelectedDate() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("d");
  const date: ISODate = raw && isValidISO(raw) ? raw : todayISO();

  const setDate = useCallback(
    (next: ISODate) => {
      const p = new URLSearchParams(params);
      if (next === todayISO()) p.delete("d");
      else p.set("d", next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  return {
    date,
    setDate,
    isToday: date === todayISO(),
    goPrev: () => setDate(shiftISO(date, -1)),
    goNext: () => setDate(shiftISO(date, 1)),
    goToday: () => setDate(todayISO()),
  };
}
