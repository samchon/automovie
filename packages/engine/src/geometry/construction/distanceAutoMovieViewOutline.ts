import type { AutoMovieViewOutline } from "./AutoMovieViewOutline";
import { AutoMovieViewParameter } from "./AutoMovieViewParameter";
import { rootsAutoMovieViewPolynomial } from "./rootsAutoMovieViewPolynomial";

/**
 * Numerical squared-distance candidates on an original scalar graph in a fixed orthonormal chart.
 *
 * The caller supplies a fixed target (targetStation,targetValue), with both coordinates and the source ordinate in the station's length unit. This is the graph (s,r(s)); it does not interpret an affine/moving world origin or a three-dimensional curve. The explicit finite closed interval must lie within the original knots; a singleton returns its one endpoint. Angle parameters and open extensions fail. Source endpoints, included named knots and derivative-root candidates are returned, not an exact maximum, certified enclosure or guarantee of separating ill-conditioned roots.
 *
 * @evidence contracts/common.md#principled-implementation For each original cubic/quintic span forms (S-targetStation)S'+(R-targetValue)R' in its unit parameter. Station/root inverses have degree one/two, giving derivative degree at most five/nine. MIT Patrikalakis-Maekawa-Cho section 7.2.1 gives the squared-distance stationarity and separate boundary comparisons; the shared numerical root owner states its residual and conditioning limits.
 * @evidence contracts/common.md#clear-and-simple-design One source-only operation owns coefficient assembly and delegates polynomial roots and station inversion to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads prepared source coefficients without fitting samples, mutating source values, clamping roots or substituting linear support; unsupported parameters and unrepresentable coefficient arithmetic return a failure.
 * @evidence contracts/common.md#meaningful-documentation States the fixed-chart/common-unit premise, explicit closed subset, singleton result, derivative degrees and numerical proof limits; https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node135.html is the geometric basis.
 * @evidence contracts/performance.md#efficient-algorithms Visits n spans with degree d<=9; O(60*n*d*2^d+n log n) work covers derivative-root recursion and sorting of the O(n) bounded-degree candidate list. No source sampling grid is used.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses admitted natural curvatures or requested Hermite coefficients and their original parameter partition without another spline solve.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Invocation-local degree-at-most-nine rows and at most 511 root observations per span join O(n) endpoint/knot candidates; no cache, handle or source retention survives the call.
 * @returns Sorted unique endpoint/knot/numerical critical stations, or a premise/arithmetic failure string.
 */
export function distanceAutoMovieViewOutline(outline: AutoMovieViewOutline.IOutline, targetStation: number, targetValue: number, domain: readonly [number, number]): number[] | string {
  if (!Number.isFinite(targetStation) || !Number.isFinite(targetValue) || domain.length !== 2 || !domain.every(Number.isFinite) || domain[0] > domain[1] || domain[0] < outline.domain[0] || domain[1] > outline.domain[1]) return "source graph distance needs a finite target and closed domain within its source knots";
  if (outline.parameter?.type === "angle") return "source graph distance supports only station/root parameters in a fixed orthonormal chart, not angle, moving-frame or general three-dimensional curves";
  if (domain[0] === domain[1]) return [domain[0]];
  const { xs, ys, curvatures }: AutoMovieViewOutline.IOutline["spline"] = outline.spline;
  const result: number[] = [domain[0], ...outline.knots.map((k: AutoMovieViewOutline.IOutline["knots"][number]): number => k.station).filter((s: number): boolean => s > domain[0] && s < domain[1]), domain[1]];
  const start: number = AutoMovieViewParameter.at(outline.parameter, domain[0]);
  const end: number = AutoMovieViewParameter.at(outline.parameter, domain[1]);
  for (let i: number = 0; i + 1 < xs.length; i++) {
    const x0: number = xs[i]!;
    const h: number = xs[i + 1]! - x0;
    if (x0 >= end || xs[i + 1]! <= start) continue;
    const p: AutoMovieViewOutline.IOutline["parameter"] = outline.parameter;
    const sign: number = p?.type === "root" && p.end === "top" ? -1 : 1;
    const station: number[] = p === undefined ? [x0 - targetStation, h] : [p.pole + sign * x0 * x0 - targetStation, sign * 2 * x0 * h, sign * h * h];
    const ordinate: number[] = [ys[i]! - targetValue, ...(outline.hermite?.coefficients[i] ?? [h * ((ys[i + 1]! - ys[i]!) / h - h * (2 * curvatures[i]! + curvatures[i + 1]!) / 6), h * h * curvatures[i]! / 2, h * h * (curvatures[i + 1]! - curvatures[i]!) / 6])];
    if (![...station, ...ordinate].every(Number.isFinite)) return `source graph distance interval ${i} has unrepresentable displacement coefficients`;

    // A common positive scale preserves distance stationarity while avoiding
    // overflow when the two coordinate polynomials are multiplied.
    const scale: number = Math.max(...station.map(Math.abs), ...ordinate.map(Math.abs));
    if (!(scale > 0)) return `source graph distance interval ${i} has no representable displacement scale`;
    const rows: number[][] = [station, ordinate].map((row: number[]): number[] => row.map((v: number): number => v / scale));
    if (rows.some((row: number[], k: number): boolean => row.some((v: number, j: number): boolean => v === 0 && [station, ordinate][k]![j] !== 0))) return `source graph distance interval ${i} loses a displacement coefficient under normalization`;
    const polynomial: number[] = new Array<number>(2 * (Math.max(station.length, ordinate.length) - 1)).fill(0);
    for (const row of rows) for (let a: number = 0; a < row.length; a++) for (let b: number = 1; b < row.length; b++) {
      const product: number = row[a]! * b * row[b]!;
      if (product === 0 && row[a] !== 0 && row[b] !== 0) return `source graph distance interval ${i} loses a derivative product under multiplication`;
      polynomial[a + b - 1] = polynomial[a + b - 1]! + product;
    }
    const lower: number = Math.max(0, (start - x0) / h);
    const upper: number = Math.min(1, (end - x0) / h);
    for (const t of rootsAutoMovieViewPolynomial(polynomial)) {
      if (!(t > lower && t < upper)) continue;
      const s: number = AutoMovieViewParameter.station(p, x0 + h * t);
      if (!Number.isFinite(s)) return `source graph distance interval ${i} has an unrepresentable station`;
      if (s > domain[0] && s < domain[1]) result.push(s);
    }
  }
  return [...new Set(result)].sort((a: number, b: number): number => a - b);
}
