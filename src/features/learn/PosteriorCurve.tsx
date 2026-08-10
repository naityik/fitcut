import * as React from "react";

const W = 700;
const H = 118;
const PAD = 6;
const N = 160;

/**
 * Where the belief sits for a given completion fraction. Shared with the readout so the
 * numbers under the chart always describe the curve above them.
 *
 * The mean stops at 0.92 rather than running to 1.0: a Gaussian centred on the axis edge
 * has half its mass off-canvas, and the collapsed posterior — the whole point of finishing
 * — would render as a cut-off ramp instead of a spike.
 */
export function posteriorParams(fraction: number) {
  return { mu: 0.12 + 0.8 * fraction, sd: 0.3 - 0.245 * fraction };
}

/** The reference curve, held fixed so the narrowing is legible rather than merely asserted. */
const PRIOR = posteriorParams(0);

/** Gaussian bump, normalised to its own peak so the curve always fills the box. */
function densityPath(mu: number, sd: number) {
  let peak = 0;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const x = i / N;
    const y = Math.exp(-0.5 * ((x - mu) / sd) ** 2);
    peak = Math.max(peak, y);
    pts.push([x, y]);
  }
  return pts
    .map(([x, y], i) => {
      const px = PAD + x * (W - 2 * PAD);
      const py = H - PAD - (y / peak) * (H - 2 * PAD - 4);
      return `${i === 0 ? "M" : "L"}${px.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * A posterior over "ready on 1 September" that concentrates as days are completed.
 *
 * It is a visual conceit, not an inference — but it is the right conceit for a plan about
 * inference, and it is the one thing on the page that makes progress feel like evidence
 * rather than a percentage. The dashed line is the flat-ish prior, held fixed for
 * comparison, so the narrowing is legible rather than merely asserted.
 */
export function PosteriorCurve({ fraction }: { fraction: number }) {
  const { mu, sd, curve, area, prior } = React.useMemo(() => {
    const { mu, sd } = posteriorParams(fraction);
    const curve = densityPath(mu, sd);
    return {
      mu,
      sd,
      curve,
      area: `${curve} L${W - PAD} ${H - PAD} L${PAD} ${H - PAD} Z`,
      prior: densityPath(PRIOR.mu, PRIOR.sd),
    };
  }, [fraction]);

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="block h-[118px] w-full"
        role="img"
        aria-label={
          fraction === 0
            ? "Flat prior over readiness — no days completed yet"
            : `Posterior over readiness, mean ${mu.toFixed(2)}, standard deviation ${sd.toFixed(2)}`
        }
      >
        <path
          d={prior}
          fill="none"
          stroke="hsl(var(--cardio))"
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.5}
        />
        <path d={area} fill="hsl(var(--protein))" opacity={0.13} />
        <path
          d={curve}
          fill="none"
          stroke="hsl(var(--protein))"
          strokeWidth={2}
          style={{ transition: "d .5s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <figcaption className="mt-1 flex justify-between border-t border-line pt-1.5 text-[10.5px] text-faint">
        <span>not ready</span>
        <span>ready</span>
      </figcaption>
    </figure>
  );
}

/** The one-line readout beside the chart. */
export function posteriorStat(done: number, total: number) {
  if (done === 0) return "flat prior · no evidence yet";
  if (done >= total) return `ready · ${done} / ${total} · posterior collapsed`;
  const { mu, sd } = posteriorParams(done / total);
  return `mean ${mu.toFixed(2)} · sd ${sd.toFixed(2)} · narrowing`;
}
