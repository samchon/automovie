import { adjacentAutoMovieFloat64 } from "@automovie/engine/math/adjacentAutoMovieFloat64";
import type { IAutoMovieSimplexAtom } from "@automovie/engine/math/IAutoMovieSimplexAtom";

import type { IAutoMovieRecoverySqpMix } from "../structures/internal/IAutoMovieRecoverySqpMix";

/**
 * Try nominal physical mixing, then one original-row-supported coefficient.
 * The numerical branch is not the ideal cubic-rate mixture. Its operation-
 * scaled margin chooses a new vector, never an allowance on that vector's rows.
 *
 * @evidence contracts/common.md#principled-implementation Each original affine inequality and the objective define a scalar interval on the same segment. A gamma_(4k+16) dot/interpolation scale moves its bound inward; a newly materialized candidate must still pass raw original feasibility, active strictness and objective descent without an allowance.
 * @evidence contracts/common.md#clear-and-simple-design The current owner supplies already admitted physical directions and rows; only the coefficient changes. Nominal and at most one numerical candidate have distinct results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no fixed weight floor, repeated next-float search, row deletion, residual clipping, tolerance change or success fallback. An empty/unresolved segment returns null for the original step owner.
 * @evidence contracts/common.md#meaningful-documentation Uses physical coordinates and preserves rho0 before considering computed equality error. The scaling is a numerical support heuristic; the direct returned-row checks, not an interval theorem, decide support.
 * @evidence contracts/performance.md#efficient-algorithms Two O(n+Z+m) candidate checks and one complete interval scan use bounded outward neighbours and O(n) vectors, prepaid in the auxiliary owner reserve.
 * @evidence contracts/performance.md#reuse-equivalent-work The same rows and two qualified direction candidates are reused without a new metric, factor, objective evaluation or geometry trial.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The owner admits at most two simultaneous candidate vectors before calling. Only the supported vector and scalar status transfer; no trajectory is retained.
 */
export function mixRecoveryFeasibleSqpStep(
  rows: readonly IAutoMovieSimplexAtom[],
  sqp: readonly number[],
  tilted: readonly number[],
  nominal: number,
): IAutoMovieRecoverySqpMix {
  const result: IAutoMovieRecoverySqpMix = {
    step: null, weight: nominal, numericalAttempted: false, numericalSupported: false,
  };
  const candidate: (weight: number) => number[] | null = (weight: number): number[] | null => {
    const step: number[] = sqp.map((value: number, at: number): number => (1 - weight) * value + weight * tilted[at]!);
    if (!step.every(Number.isFinite)) return null;
    for (let at: number = 0; at < rows.length; at++) {
      const row: IAutoMovieSimplexAtom = rows[at]!;
      let slope: number = 0;
      for (let entry: number = 0; entry < row.indices.length; entry++) slope += row.values[entry]! * step[row.indices[entry]!]!;
      if (!Number.isFinite(slope) || (at === 0 ? !(slope < 0) : slope > row.offset || (row.offset === 0 && !(slope < 0)))) return null;
    }
    return step;
  };
  result.step = candidate(nominal);
  if (result.step !== null) return result;
  result.numericalAttempted = true;
  let lower: number = nominal, upper: number = 1;
  for (const row of rows) {
    let first: number = -row.offset, second: number = -row.offset;
    let magnitude: number = 2 * Math.abs(row.offset);
    for (let entry: number = 0; entry < row.indices.length; entry++) {
      const a: number = row.values[entry]! * sqp[row.indices[entry]!]!;
      const b: number = row.values[entry]! * tilted[row.indices[entry]!]!;
      first += a; second += b;
      magnitude = adjacentAutoMovieFloat64(magnitude + Math.abs(a) + Math.abs(b), true);
    }
    const operations: number = 4 * row.indices.length + 16;
    const product: number = operations * (Number.EPSILON / 2);
    const gamma: number = adjacentAutoMovieFloat64(product / adjacentAutoMovieFloat64(1 - product, false), true);
    const margin: number = adjacentAutoMovieFloat64(gamma * magnitude + operations * Number.MIN_VALUE, true);
    const difference: number = second - first;
    if (![first, second, margin, difference].every(Number.isFinite) || !(product < 1)) return result;
    if (difference < 0) {
      if (first > -margin) lower = Math.max(lower, adjacentAutoMovieFloat64((first + margin) / -difference, true));
    } else if (difference > 0) upper = Math.min(upper, adjacentAutoMovieFloat64((-margin - first) / difference, false));
    else if (first > -margin) return result;
  }
  if (!(lower > nominal && lower < 1 && lower <= upper)) return result;
  result.weight = lower;
  result.step = candidate(lower);
  result.numericalSupported = result.step !== null;
  return result;
}
