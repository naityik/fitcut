import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, CalendarRange, Dumbbell, LayoutDashboard, Scale, Settings, UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePhase } from "@/features/plan/PhaseProvider";
import { phaseDayNumber, todayISO } from "@/lib/date";

/**
 * `mobile` marks what earns a slot in the bottom bar; Settings lives on the desktop rail
 * only.
 *
 * /learn and /timeline are deliberately absent from both. They are reference pages rather
 * than daily logging, reached by typing the URL — the routes exist in App.tsx and work
 * normally, they just do not take a nav slot.
 */
const NAV = [
  { to: "/", label: "Today", icon: LayoutDashboard, end: true, mobile: true },
  { to: "/food", label: "Food", icon: UtensilsCrossed, mobile: true },
  { to: "/workout", label: "Workout", icon: Dumbbell, mobile: true },
  { to: "/weight", label: "Weight", icon: Scale, mobile: true },
  { to: "/analytics", label: "Lifts", icon: Activity, mobile: true },
  { to: "/tracker", label: "Tracker", icon: CalendarRange, mobile: true },
  { to: "/settings", label: "Settings", icon: Settings, mobile: false },
];

export function AppShell() {
  const { phase, window: win } = usePhase();
  const day = phaseDayNumber(todayISO(), phase.start_date);
  const progress = Math.min(Math.max(day / win.totalDays, 0), 1);

  return (
    <div className="flex min-h-full">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col border-r border-line bg-surface px-3 py-5 lg:flex">
        <div className="px-3">
          <p className="font-display text-[17px] font-extrabold tracking-[-0.02em]">FitCut</p>
          <p className="mt-0.5 text-[11px] text-faint">
            Day {Math.max(day, 0)} of {win.totalDays}
          </p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-line">
            <motion.div
              className="h-full rounded-full bg-jade"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        <nav className="mt-7 flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-jade/8 text-jade" : "text-muted hover:bg-ink/[0.04] hover:text-ink",
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-10 pt-4 sm:px-6 lg:max-w-[860px] lg:pt-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile tab bar */}
      <nav className="glass safe-bottom fixed inset-x-0 bottom-0 z-30 flex border-t border-line lg:hidden">
        {NAV.filter((n) => n.mobile).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                // Labels truncate rather than wrap, so adding a tab can never push the
                // bar taller than its icons.
                "relative flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-2.5 text-[10px] font-semibold transition-colors",
                isActive ? "text-jade" : "text-faint",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute inset-x-[26%] top-0 h-[2.5px] rounded-full bg-jade"
                    transition={{ type: "spring", stiffness: 480, damping: 38 }}
                  />
                )}
                <Icon className="h-[21px] w-[21px] shrink-0" strokeWidth={isActive ? 2.4 : 2} />
                <span className="w-full truncate text-center">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
