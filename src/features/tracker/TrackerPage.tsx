import { useState } from "react";

/**
 * The 16-week recomp plan, ported from the standalone JSX exactly as written — same
 * layout, same inline styles, same copy. The only substantive change is the palette,
 * inverted from the original zinc-950 dark scheme to a light one:
 *
 *   page  #09090b → #f4f4f5      card    #18181b → #ffffff
 *   text  #f4f4f5 → #18181b      border  #27272a → #e4e4e7
 *
 * Accent hues are unchanged where they carry meaning and still read on white; the ones
 * that were tuned for a dark background (amber #fbbf24, the action-banner reds and
 * yellows) are darkened rather than re-hued, so the semantics survive the inversion.
 *
 * Weights are the plan's projections, not logged data — the Weight tab holds the real
 * mornings.
 */

interface TrackerDay {
  date: string;
  day: string;
  weight: number;
}

interface TrackerAction {
  type: "diet" | "cardio";
  label: string;
  detail: string;
}

interface TrackerWeek {
  weekNum: number;
  dates: string;
  calories: number;
  cardio: number;
  days: TrackerDay[];
  avg: number;
  delta: number | null;
  status: "baseline" | "progress" | "plateau";
  action: TrackerAction | null;
  note: string | null;
}

const weeks: TrackerWeek[] = [
  {
    weekNum: 1, dates: "Aug 5–11", calories: 2400, cardio: 0,
    days: [
      { date: "Aug 5", day: "Wed", weight: 71.08 },
      { date: "Aug 6", day: "Thu", weight: 70.7 },
      { date: "Aug 7", day: "Fri", weight: 70.4 },
      { date: "Aug 8", day: "Sat", weight: 70.6 },
      { date: "Aug 9", day: "Sun", weight: 70.2 },
      { date: "Aug 10", day: "Mon", weight: 70.0 },
      { date: "Aug 11", day: "Tue", weight: 70.3 },
    ],
    avg: 70.47, delta: null, status: "baseline",
    action: null,
    note: "Weeks 1–2: Expect a bigger drop from water & glycogen shift — you just started training. Don't be fooled into thinking the deficit is too steep.",
  },
  {
    weekNum: 2, dates: "Aug 12–18", calories: 2400, cardio: 0,
    days: [
      { date: "Aug 12", day: "Wed", weight: 70.1 },
      { date: "Aug 13", day: "Thu", weight: 69.9 },
      { date: "Aug 14", day: "Fri", weight: 70.2 },
      { date: "Aug 15", day: "Sat", weight: 69.8 },
      { date: "Aug 16", day: "Sun", weight: 70.0 },
      { date: "Aug 17", day: "Mon", weight: 69.7 },
      { date: "Aug 18", day: "Tue", weight: 69.9 },
    ],
    avg: 69.94, delta: 0.53, status: "progress",
    action: null, note: null,
  },
  {
    weekNum: 3, dates: "Aug 19–25", calories: 2400, cardio: 0,
    days: [
      { date: "Aug 19", day: "Wed", weight: 69.8 },
      { date: "Aug 20", day: "Thu", weight: 69.6 },
      { date: "Aug 21", day: "Fri", weight: 69.9 },
      { date: "Aug 22", day: "Sat", weight: 69.7 },
      { date: "Aug 23", day: "Sun", weight: 69.5 },
      { date: "Aug 24", day: "Mon", weight: 69.8 },
      { date: "Aug 25", day: "Tue", weight: 69.6 },
    ],
    avg: 69.70, delta: 0.24, status: "progress",
    action: null,
    note: "Real fat-loss trend begins here. Water noise has settled.",
  },
  {
    weekNum: 4, dates: "Aug 26–Sep 1", calories: 2400, cardio: 0,
    days: [
      { date: "Aug 26", day: "Wed", weight: 69.5 },
      { date: "Aug 27", day: "Thu", weight: 69.4 },
      { date: "Aug 28", day: "Fri", weight: 69.6 },
      { date: "Aug 29", day: "Sat", weight: 69.3 },
      { date: "Aug 30", day: "Sun", weight: 69.5 },
      { date: "Aug 31", day: "Mon", weight: 69.4 },
      { date: "Sep 1", day: "Tue", weight: 69.3 },
    ],
    avg: 69.43, delta: 0.27, status: "progress",
    action: null, note: null,
  },
  {
    weekNum: 5, dates: "Sep 2–8", calories: 2400, cardio: 0,
    days: [
      { date: "Sep 2", day: "Wed", weight: 69.4 },
      { date: "Sep 3", day: "Thu", weight: 69.5 },
      { date: "Sep 4", day: "Fri", weight: 69.3 },
      { date: "Sep 5", day: "Sat", weight: 69.5 },
      { date: "Sep 6", day: "Sun", weight: 69.3 },
      { date: "Sep 7", day: "Mon", weight: 69.4 },
      { date: "Sep 8", day: "Tue", weight: 69.3 },
    ],
    avg: 69.39, delta: 0.04, status: "plateau",
    action: { type: "diet", label: "Diet drop", detail: "2,400 → 2,300 kcal. Remove 1 bread slice or ~30g chana." },
    note: null,
  },
  {
    weekNum: 6, dates: "Sep 9–15", calories: 2300, cardio: 0,
    days: [
      { date: "Sep 9", day: "Wed", weight: 69.2 },
      { date: "Sep 10", day: "Thu", weight: 69.0 },
      { date: "Sep 11", day: "Fri", weight: 69.1 },
      { date: "Sep 12", day: "Sat", weight: 68.9 },
      { date: "Sep 13", day: "Sun", weight: 69.0 },
      { date: "Sep 14", day: "Mon", weight: 68.8 },
      { date: "Sep 15", day: "Tue", weight: 68.9 },
    ],
    avg: 68.99, delta: 0.40, status: "progress",
    action: null,
    note: "Diet drop working. Hold at 2,300 kcal for at least 2 weeks before re-evaluating.",
  },
  {
    weekNum: 7, dates: "Sep 16–22", calories: 2300, cardio: 0,
    days: [
      { date: "Sep 16", day: "Wed", weight: 68.8 },
      { date: "Sep 17", day: "Thu", weight: 68.7 },
      { date: "Sep 18", day: "Fri", weight: 68.9 },
      { date: "Sep 19", day: "Sat", weight: 68.7 },
      { date: "Sep 20", day: "Sun", weight: 68.6 },
      { date: "Sep 21", day: "Mon", weight: 68.8 },
      { date: "Sep 22", day: "Tue", weight: 68.7 },
    ],
    avg: 68.74, delta: 0.25, status: "progress",
    action: null, note: null,
  },
  {
    weekNum: 8, dates: "Sep 23–29", calories: 2300, cardio: 0,
    days: [
      { date: "Sep 23", day: "Wed", weight: 68.6 },
      { date: "Sep 24", day: "Thu", weight: 68.7 },
      { date: "Sep 25", day: "Fri", weight: 68.5 },
      { date: "Sep 26", day: "Sat", weight: 68.7 },
      { date: "Sep 27", day: "Sun", weight: 68.6 },
      { date: "Sep 28", day: "Mon", weight: 68.5 },
      { date: "Sep 29", day: "Tue", weight: 68.6 },
    ],
    avg: 68.60, delta: 0.14, status: "plateau",
    action: { type: "cardio", label: "Add cardio", detail: "1.4km run added (~100 kcal burn). Diet stays at 2,300 kcal." },
    note: null,
  },
  {
    weekNum: 9, dates: "Sep 30–Oct 6", calories: 2300, cardio: 100,
    days: [
      { date: "Sep 30", day: "Wed", weight: 68.5 },
      { date: "Oct 1", day: "Thu", weight: 68.3 },
      { date: "Oct 2", day: "Fri", weight: 68.4 },
      { date: "Oct 3", day: "Sat", weight: 68.2 },
      { date: "Oct 4", day: "Sun", weight: 68.3 },
      { date: "Oct 5", day: "Mon", weight: 68.1 },
      { date: "Oct 6", day: "Tue", weight: 68.2 },
    ],
    avg: 68.29, delta: 0.31, status: "progress",
    action: null,
    note: "Cardio stimulus working. You'll feel this in your lifts initially — push through.",
  },
  {
    weekNum: 10, dates: "Oct 7–13", calories: 2300, cardio: 100,
    days: [
      { date: "Oct 7", day: "Wed", weight: 68.1 },
      { date: "Oct 8", day: "Thu", weight: 68.0 },
      { date: "Oct 9", day: "Fri", weight: 68.2 },
      { date: "Oct 10", day: "Sat", weight: 68.0 },
      { date: "Oct 11", day: "Sun", weight: 67.9 },
      { date: "Oct 12", day: "Mon", weight: 68.1 },
      { date: "Oct 13", day: "Tue", weight: 68.0 },
    ],
    avg: 68.04, delta: 0.25, status: "progress",
    action: null, note: null,
  },
  {
    weekNum: 11, dates: "Oct 14–20", calories: 2300, cardio: 100,
    days: [
      { date: "Oct 14", day: "Wed", weight: 67.9 },
      { date: "Oct 15", day: "Thu", weight: 68.0 },
      { date: "Oct 16", day: "Fri", weight: 67.8 },
      { date: "Oct 17", day: "Sat", weight: 68.0 },
      { date: "Oct 18", day: "Sun", weight: 67.9 },
      { date: "Oct 19", day: "Mon", weight: 67.8 },
      { date: "Oct 20", day: "Tue", weight: 67.9 },
    ],
    avg: 67.90, delta: 0.14, status: "plateau",
    action: { type: "diet", label: "Diet drop", detail: "2,300 → 2,200 kcal. Remove another bread slice or reduce chana portion." },
    note: null,
  },
  {
    weekNum: 12, dates: "Oct 21–27", calories: 2200, cardio: 100,
    days: [
      { date: "Oct 21", day: "Wed", weight: 67.8 },
      { date: "Oct 22", day: "Thu", weight: 67.6 },
      { date: "Oct 23", day: "Fri", weight: 67.7 },
      { date: "Oct 24", day: "Sat", weight: 67.5 },
      { date: "Oct 25", day: "Sun", weight: 67.6 },
      { date: "Oct 26", day: "Mon", weight: 67.4 },
      { date: "Oct 27", day: "Tue", weight: 67.5 },
    ],
    avg: 67.59, delta: 0.31, status: "progress",
    action: null, note: null,
  },
  {
    weekNum: 13, dates: "Oct 28–Nov 3", calories: 2200, cardio: 100,
    days: [
      { date: "Oct 28", day: "Wed", weight: 67.4 },
      { date: "Oct 29", day: "Thu", weight: 67.5 },
      { date: "Oct 30", day: "Fri", weight: 67.3 },
      { date: "Oct 31", day: "Sat", weight: 67.5 },
      { date: "Nov 1", day: "Sun", weight: 67.4 },
      { date: "Nov 2", day: "Mon", weight: 67.3 },
      { date: "Nov 3", day: "Tue", weight: 67.4 },
    ],
    avg: 67.40, delta: 0.19, status: "progress",
    action: null,
    note: "Progress still happening but slowing. Keep tracking daily — this is where most people panic and change too early.",
  },
  {
    weekNum: 14, dates: "Nov 4–10", calories: 2200, cardio: 100,
    days: [
      { date: "Nov 4", day: "Wed", weight: 67.3 },
      { date: "Nov 5", day: "Thu", weight: 67.4 },
      { date: "Nov 6", day: "Fri", weight: 67.2 },
      { date: "Nov 7", day: "Sat", weight: 67.4 },
      { date: "Nov 8", day: "Sun", weight: 67.3 },
      { date: "Nov 9", day: "Mon", weight: 67.2 },
      { date: "Nov 10", day: "Tue", weight: 67.3 },
    ],
    avg: 67.30, delta: 0.10, status: "plateau",
    action: { type: "cardio", label: "Add cardio", detail: "Run extended to ~2.8km (+200 kcal burn total). Diet stays at 2,200 kcal." },
    note: null,
  },
  {
    weekNum: 15, dates: "Nov 11–17", calories: 2200, cardio: 200,
    days: [
      { date: "Nov 11", day: "Wed", weight: 67.1 },
      { date: "Nov 12", day: "Thu", weight: 66.9 },
      { date: "Nov 13", day: "Fri", weight: 67.0 },
      { date: "Nov 14", day: "Sat", weight: 66.8 },
      { date: "Nov 15", day: "Sun", weight: 66.9 },
      { date: "Nov 16", day: "Mon", weight: 66.7 },
      { date: "Nov 17", day: "Tue", weight: 66.8 },
    ],
    avg: 66.89, delta: 0.41, status: "progress",
    action: null,
    note: "Second cardio bump working. End of November in sight — you're on track for your goal.",
  },
  {
    weekNum: 16, dates: "Nov 18–24", calories: 2200, cardio: 200,
    days: [
      { date: "Nov 18", day: "Wed", weight: 66.7 },
      { date: "Nov 19", day: "Thu", weight: 66.6 },
      { date: "Nov 20", day: "Fri", weight: 66.8 },
      { date: "Nov 21", day: "Sat", weight: 66.6 },
      { date: "Nov 22", day: "Sun", weight: 66.5 },
      { date: "Nov 23", day: "Mon", weight: 66.7 },
      { date: "Nov 24", day: "Tue", weight: 66.6 },
    ],
    avg: 66.64, delta: 0.25, status: "progress",
    action: null,
    note: "16 weeks done. ~4.4kg down. Visible recomp: smaller waist, same or stronger lifts. This is your Dheeraj window.",
  },
];

function Sparkline({ days }: { days: TrackerDay[] }) {
  const weights = days.map((d) => d.weight);
  const min = Math.min(...weights) - 0.2;
  const max = Math.max(...weights) + 0.2;
  const W = 120, H = 32;
  const xStep = W / (weights.length - 1);
  const yScale = (w: number) => H - ((w - min) / (max - min)) * H;
  const points = weights.map((w, i) => `${i * xStep},${yScale(w)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {weights.map((w, i) => (
        <circle key={i} cx={i * xStep} cy={yScale(w)} r="2" fill="#6366f1" />
      ))}
    </svg>
  );
}

const CAL_COLORS: Record<number, string> = { 2400: "#2563eb", 2300: "#7c3aed", 2200: "#d97706" };

export function TrackerPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const toggle = (n: number) => setExpanded(expanded === n ? null : n);

  const statusDot = (status: TrackerWeek["status"]) => {
    if (status === "progress") return "#16a34a";
    if (status === "plateau") return "#dc2626";
    return "#64748b";
  };

  return (
    <div style={{ background: "#f4f4f5", minHeight: "100vh", fontFamily: "'system-ui', sans-serif", color: "#18181b", padding: "20px 16px", maxWidth: 640, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#71717a", textTransform: "uppercase", marginBottom: 6 }}>Recomp · Aug 5 → Nov 24</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>16-Week Plan</h1>
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          {[
            { label: "Start", val: "71.08 kg" },
            { label: "Projected", val: "~66.6 kg" },
            { label: "Drop", val: "~4.4 kg" },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Calorie timeline strip */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, fontWeight: 600 }}>Calorie level by week</div>
        <div style={{ display: "flex", gap: 3 }}>
          {weeks.map((w) => (
            <div key={w.weekNum} style={{ flex: 1 }}>
              <div style={{
                height: 20, borderRadius: 3,
                background: CAL_COLORS[w.calories],
                opacity: w.cardio > 0 ? 1 : 0.75,
                position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {w.cardio > 0 && (
                  <span style={{ position: "absolute", top: -8, fontSize: 8, color: "#d97706", fontWeight: 800 }}>▲</span>
                )}
              </div>
              <div style={{ fontSize: 8, color: "#a1a1aa", textAlign: "center", marginTop: 2 }}>W{w.weekNum}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 8, flexWrap: "wrap" }}>
          {[["#2563eb", "2,400 kcal"], ["#7c3aed", "2,300 kcal"], ["#d97706", "2,200 kcal"]].map(([c, l]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ fontSize: 10, color: "#52525b" }}>{l}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, color: "#d97706" }}>▲</span>
            <span style={{ fontSize: 10, color: "#52525b" }}>+ cardio run</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #e4e4e7", marginBottom: 20 }} />

      {/* Week cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {weeks.map((week) => {
          const isOpen = expanded === week.weekNum;
          return (
            <div key={week.weekNum} style={{
              background: "#ffffff",
              borderRadius: 12,
              overflow: "hidden",
              border: `1px solid ${week.status === "plateau" ? "#fecaca" : "#e4e4e7"}`,
            }}>
              {week.action && (
                <div style={{
                  background: week.action.type === "diet" ? "#fef2f2" : "#fffbeb",
                  borderBottom: `1px solid ${week.action.type === "diet" ? "#fecaca" : "#fde68a"}`,
                  padding: "8px 14px",
                  display: "flex", alignItems: "flex-start", gap: 8,
                }}>
                  <span style={{ fontSize: 14 }}>{week.action.type === "diet" ? "🔻" : "🏃"}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: week.action.type === "diet" ? "#b91c1c" : "#b45309", textTransform: "uppercase", letterSpacing: "0.06em" }}>{week.action.label} triggered</div>
                    <div style={{ fontSize: 11, color: "#52525b", marginTop: 1 }}>{week.action.detail}</div>
                  </div>
                </div>
              )}

              <div
                onClick={() => toggle(week.weekNum)}
                style={{ padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: statusDot(week.status) + "1A",
                  border: `1.5px solid ${statusDot(week.status)}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800, color: statusDot(week.status),
                }}>
                  W{week.weekNum}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{week.dates}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                      background: CAL_COLORS[week.calories] + "1A",
                      color: CAL_COLORS[week.calories],
                    }}>{week.calories} kcal</span>
                    {week.cardio > 0 && (
                      <span style={{ fontSize: 10, color: "#d97706", fontWeight: 600 }}>+{week.cardio} cardio</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: "#71717a", marginTop: 2 }}>
                    {week.status === "baseline" ? "Baseline week" :
                      week.status === "plateau" ? `Delta: −${week.delta?.toFixed(2)} kg  ⚠ Plateau` :
                      `Delta: −${week.delta?.toFixed(2)} kg  ✓ On track`}
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{week.avg.toFixed(2)}</div>
                  <div style={{ fontSize: 9, color: "#a1a1aa", textAlign: "right" }}>kg avg</div>
                  <div style={{ marginTop: 4 }}>
                    <Sparkline days={week.days} />
                  </div>
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 14px 14px" }}>
                  <div style={{ borderTop: "1px solid #e4e4e7", paddingTop: 12, marginBottom: 10 }} />
                  <div style={{ fontSize: 10, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 8 }}>Daily log</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
                    {week.days.map((d, i) => (
                      <div key={i} style={{ background: "#f4f4f5", borderRadius: 6, padding: "6px 2px", textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#71717a", fontWeight: 700 }}>{d.day}</div>
                        <div style={{ fontSize: 8, color: "#a1a1aa", marginBottom: 3 }}>{d.date.split(" ")[1]}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{d.weight}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{
                    marginTop: 10, background: "#f4f4f5", borderRadius: 8, padding: "8px 12px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <span style={{ fontSize: 11, color: "#71717a" }}>7-day average</span>
                    <span style={{ fontSize: 15, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{week.avg.toFixed(2)} kg</span>
                  </div>
                  {week.note && (
                    <div style={{
                      marginTop: 8, padding: "8px 10px",
                      background: "#0000000a", borderLeft: "3px solid #d4d4d8", borderRadius: "0 6px 6px 0",
                      fontSize: 11, color: "#52525b", lineHeight: 1.5,
                    }}>
                      {week.note}
                    </div>
                  )}
                </div>
              )}

              {!isOpen && (
                <div style={{ padding: "0 14px 8px", fontSize: 10, color: "#a1a1aa" }}>
                  Tap to expand daily logs ↑
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div style={{ marginTop: 20, background: "#ffffff", borderRadius: 12, padding: 16, border: "1px solid #e4e4e7" }}>
        <div style={{ fontSize: 10, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 12 }}>16-week summary</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { val: "−4.4 kg", label: "Scale drop", color: "#16a34a" },
            { val: "2×", label: "Diet drops", color: "#2563eb" },
            { val: "2×", label: "Cardio adds", color: "#d97706" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#f4f4f5", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "#71717a", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#f4f4f5", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Your decision rule</div>
          {[
            { col: "#16a34a", text: "Delta ≥ 0.30 kg  →  Strong progress. Hold." },
            { col: "#65a30d", text: "Delta 0.15–0.29 kg  →  Progress. Hold." },
            { col: "#dc2626", text: "Delta < 0.15 kg  →  Plateau. Trigger next step." },
          ].map((r) => (
            <div key={r.text} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: r.col, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#52525b" }}>{r.text}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 10, color: "#a1a1aa", marginTop: 12, lineHeight: 1.6 }}>
          These are dummy weights — replace each day with your real morning log (post-toilet, pre-food/water). The weekly average is what matters, not any single day.
        </p>
      </div>
    </div>
  );
}
