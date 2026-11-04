import type { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";
import { rootsAutoMovieViewPolynomial } from "./rootsAutoMovieViewPolynomial";
import { rootsAutoMovieViewSinPolynomial } from "./rootsAutoMovieViewSinPolynomial";

/**
 * Candidate support stations for the fixed-chart scalar function slope*s+valueScale*outline(s).
 *
 * The domain is a closed subset of the original knot span; open extensions and moving frames are excluded. Named knots and domain endpoints join the analytic derivative-root candidates. A constant offset has no effect on these stations. Identity/root source parameters give polynomial derivatives; the two-pole angle gives P(theta)+slope*stationSpan/2*sin(theta), preserving its actual trigonometric term. Critical roots are binary64 observations, not certified interval enclosures or an exact extrema promise.
 *
 * @evidence contracts/common.md#principled-implementation Differentiates the original prepared cubic/quintic and the exact station inverse in the same parameter, using polynomial roots or finite derivative-root recursion for the angle term. This applies only to a caller-established affine station origin and fixed chart direction.
 * @evidence contracts/common.md#clear-and-simple-design One scalar operation returns the stations a fixed-plane consumer evaluates with its existing source and affine origin; it neither constructs a world curve nor changes its input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No sampled maximum, fitted source, sine polynomial, clamp, moving-axis premise or final-skin readback is introduced; arithmetic/domain failures remain explicit.
 * @evidence contracts/common.md#meaningful-documentation States the affine function, units, closed subdomain, constant-offset independence and numerical root limitations.
 * @evidence contracts/performance.md#efficient-algorithms Visits n prepared source spans with degree at most five; each span has bounded-degree polynomial or sine-polynomial root work, then the finite O(n) candidate list is sorted.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads the existing natural curvatures or Hermite coefficients without rebuilding their spline, jets or source parameter.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns an invocation-owned O(n) station list and bounded-degree temporary rows per span; no source or global cache is retained.
 * @param outline Admitted original scalar source in kernel station units.
 * @param slope Affine-origin coefficient, output units per station unit.
 * @param valueScale Multiplier converting the original ordinate to output units.
 * @param domain Finite increasing closed subinterval of the original knot span.
 * @returns Endpoints, included named knots and numerical interior critical stations, or an explicit failure.
 */
export function supportAutoMovieViewOutline(outline: AutoMovieViewOutline.IOutline, slope: number, valueScale: number, domain: readonly [number, number]): number[] | string {
  if (!Number.isFinite(slope) || !Number.isFinite(valueScale) || domain.length !== 2 || !domain.every(Number.isFinite) || !(domain[0] < domain[1]) || domain[0] < outline.domain[0] || domain[1] > outline.domain[1]) return "affine source support needs finite coefficients and an increasing closed domain within its source knots";
  const { xs, ys, curvatures } = outline.spline;
  const result: number[] = [domain[0], ...outline.knots.map((k): number => k.station).filter((s: number): boolean => s > domain[0] && s < domain[1]), domain[1]];
  const start: number = AutoMovieViewParameter.at(outline.parameter, domain[0]);
  const end: number = AutoMovieViewParameter.at(outline.parameter, domain[1]);
  for (let i: number = 0; i + 1 < xs.length; i++) {
    const x0: number = xs[i]!;
    const h: number = xs[i + 1]! - x0;
    if (x0 >= end || xs[i + 1]! <= start) continue;
    const interval: [number, number] = [Math.max(0, (start - x0) / h), Math.min(1, (end - x0) / h)];
    const c: readonly number[] | undefined = outline.hermite?.coefficients[i];
    const polynomial: number[] = c === undefined
      ? [(ys[i + 1]! - ys[i]!) / h - h * (2 * curvatures[i]! + curvatures[i + 1]!) / 6, h * curvatures[i]!, h * (curvatures[i + 1]! - curvatures[i]!) / 2].map((value: number): number => valueScale * value)
      : c.map((value: number, k: number): number => valueScale * (k + 1) * value / h);
    const p: AutoMovieViewOutline.IOutline["parameter"] = outline.parameter;
    if (p === undefined) polynomial[0] = polynomial[0]! + slope;
    else if (p.type === "root") {
      const factor: number = (p.end === "bottom" ? 2 : -2) * slope;
      polynomial[0] = polynomial[0]! + factor * x0;
      polynomial[1] = polynomial[1]! + factor * h;
    }
    if (!polynomial.every(Number.isFinite)) return `affine source support interval ${i} has unrepresentable derivative coefficients`;
    const roots: number[] | string = p?.type === "angle"
      ? rootsAutoMovieViewSinPolynomial(polynomial, x0, h, slope * (p.top - p.bottom) / 2, interval)
      : rootsAutoMovieViewPolynomial(polynomial).filter((t: number): boolean => t > interval[0] && t < interval[1]);
    if (typeof roots === "string") return `affine source support interval ${i}: ${roots}`;
    for (const t of roots) {
      const station: number = AutoMovieViewParameter.station(p, x0 + h * t);
      if (!Number.isFinite(station)) return `affine source support interval ${i} has an unrepresentable station`;
      if (station > domain[0] && station < domain[1]) result.push(station);
    }
  }
  return [...new Set(result)].sort((a: number, b: number): number => a - b);
}
