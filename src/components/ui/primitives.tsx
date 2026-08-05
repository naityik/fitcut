import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  tone = "neutral", className, ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "jade" | "progress" | "plateau" | "cardio" | "protein";
}) {
  const tones = {
    neutral: "bg-ink/[0.06] text-muted",
    jade: "bg-jade/10 text-jade",
    progress: "bg-progress/10 text-progress",
    plateau: "bg-plateau/10 text-plateau",
    cardio: "bg-cardio/12 text-cardio",
    protein: "bg-protein/10 text-protein",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
        tones[tone], className,
      )}
      {...props}
    />
  );
}

/** Segmented control — the split picker and any 2–4 way choice. */
export function Segmented<T extends string>({
  value, onChange, options, className,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string; sublabel?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("flex gap-1.5 rounded-2xl bg-sunken p-1.5", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-xl px-2 py-2 text-center transition-all duration-200",
              active ? "bg-surface shadow-card" : "hover:bg-surface/60",
            )}
          >
            <span className={cn("block text-sm font-semibold", active ? "text-ink" : "text-muted")}>
              {o.label}
            </span>
            {o.sublabel && (
              <span className="mt-0.5 block text-[10px] leading-tight text-faint">{o.sublabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ink/[0.06]", className)} />;
}

export function EmptyState({
  icon, title, action, children,
}: { icon?: React.ReactNode; title: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      {icon && <div className="mb-3 text-faint">{icon}</div>}
      <p className="font-display text-[15px] font-bold">{title}</p>
      {children && <p className="mt-1 max-w-[38ch] text-[13px] leading-relaxed text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Big tabular number with a small label under it. Used everywhere. */
export function Stat({
  value, label, sub, tone, className,
}: { value: React.ReactNode; label: string; sub?: string; tone?: string; className?: string }) {
  return (
    <div className={className}>
      <div className="tnum font-display text-[22px] font-extrabold leading-none" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      <div className="eyebrow mt-1.5">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-faint">{sub}</div>}
    </div>
  );
}
