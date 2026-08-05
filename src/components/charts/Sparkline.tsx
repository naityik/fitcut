/**
 * Ported from the user's original recomp-plan component and made data-driven:
 * same shape and reading, now on real weights and the app's palette.
 */
interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export function Sparkline({
  values, width = 120, height = 32, color = "hsl(var(--jade))", showDots = true,
}: Props) {
  if (values.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden>
        <line
          x1={0} y1={height / 2} x2={width} y2={height / 2}
          stroke="hsl(var(--line))" strokeWidth={1.5} strokeDasharray="3 3"
        />
      </svg>
    );
  }
  const min = Math.min(...values) - 0.2;
  const max = Math.max(...values) + 0.2;
  const xStep = width / (values.length - 1);
  const y = (v: number) => height - ((v - min) / (max - min || 1)) * height;
  const points = values.map((v, i) => `${i * xStep},${y(v)}`).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block" aria-hidden>
      <polyline
        points={points} fill="none" stroke={color}
        strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round"
      />
      {showDots &&
        values.map((v, i) => <circle key={i} cx={i * xStep} cy={y(v)} r={2} fill={color} />)}
    </svg>
  );
}
