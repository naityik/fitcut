import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  /** 0–1; values above 1 render a second overshoot arc rather than clipping */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  className?: string;
  children?: ReactNode;
}

export function ProgressRing({
  value, size = 120, stroke = 10, color = "hsl(var(--jade))",
  track = "hsl(var(--line))", className, children,
}: Props) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const capped = Math.min(value, 1);
  const over = Math.max(0, Math.min(value - 1, 1));

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - capped * c }}
          transition={{ duration: reduce ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
        {over > 0 && (
          <motion.circle
            cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--plateau))"
            strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
            initial={reduce ? false : { strokeDashoffset: c }}
            animate={{ strokeDashoffset: c - over * c }}
            transition={{ duration: reduce ? 0 : 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Thin horizontal bar for the macro rows. */
export function MacroBar({ value, color }: { value: number; color: string }) {
  const reduce = useReducedMotion();
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={reduce ? false : { width: 0 }}
        animate={{ width: `${Math.min(value, 1) * 100}%` }}
        transition={{ duration: reduce ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
