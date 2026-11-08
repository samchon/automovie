import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";
import type { AutoMovieLoftViewRead } from "./AutoMovieLoftViewRead";

/**
 * Locate an original native coordinate on one declared monotone half profile.
 *
 * Positive rational conic weights and ordered G2 control coordinates make each
 * quarter monotone in each local coordinate in real arithmetic. Selecting the
 * sign of the other coordinate joins the two quarters of one unique half;
 * support extrema are explicit endpoint cases, not regular inverse jets.
 * Numeric native preparation/query failures remain observable. This Point0
 * inverse supplies no physical/station derivative or global float certificate.
 *
 * @evidence contracts/common.md#principled-implementation A declared monotone original branch brackets the coordinate; bounded bisection reads the identical native Point0 until the binary64 phase bracket exhausts, then requires the actual coordinate residual.
 * @evidence contracts/common.md#clear-and-simple-design Component and opposite-coordinate half sign select four supported branch charts without a Human-specific inverse or sampled display boundary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Never refits, clamps or moves the returned original point. Unreachable/nonfinite input, unresolved residual and original numeric failures refuse rather than inventing a root; source getter exceptions propagate unchanged.
 * @evidence contracts/common.md#meaningful-documentation Coordinates/targets use kernel mm, returned phase uses original radians, half refers to the other coordinate's sign, and endpoint Point0 does not imply a regular inverse derivative.
 * @evidence contracts/performance.md#efficient-algorithms One existing fixed native preparation and two endpoints precede at most64 inverse point queries; original per-phase conic/G2 cost remains included.
 * @evidence contracts/performance.md#reuse-equivalent-work One caller-owned native station closure serves all bisection readings; no final loft, original construction or display is regenerated.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call retains only its fixed geometry, scalar bracket and best original point until returning; no module cache, handle or background task exists.
 */
export namespace AutoMovieNativeCoordinate {
  /** Exact original point and observed finite numerical inverse residual. */
  export interface IResult {
    /** Original polar phase, radians, in the selected half's declared interval. */
    phase: number;
    /** Identical native local point, kernel millimetres, never adjusted to the target. */
    point: [number, number];
    /** Actual signed coordinate minus requested target, kernel millimetres. */
    residual: number;
    /** Bisection point query count, excluding the two explicit endpoints. */
    iterations: number;
  }

  /**
   * Solve local x (component0) or z (component1) on a positive/negative other-coordinate half.
   * A residual within32eps*max(1,input extents,target) is the numeric acceptance
   * criterion, not an enclosure proof for every floating-point implementation.
   */
  export function locate(
    inputs: AutoMovieLoftViewRead.IValues,
    component: 0 | 1,
    half: 1 | -1,
    target: number,
  ): IResult {
    if (
      (component !== 0 && component !== 1) ||
      (half !== 1 && half !== -1) ||
      !Number.isFinite(target)
    )
      fail(
        "Native coordinate inverse needs a finite target and a declared coordinate/half.",
      );
    const read: (phase: number) => [number, number] =
      AutoMovieLoftSectionNative.point(inputs);
    let lo: number =
      component === 1
        ? half === 1
          ? -Math.PI / 2
          : Math.PI / 2
        : half === 1
          ? 0
          : Math.PI;
    let hi: number = lo + Math.PI;
    const first: [number, number] = read(lo);
    const last: [number, number] = read(hi);
    if (
      target < Math.min(first[component], last[component]) ||
      target > Math.max(first[component], last[component])
    )
      fail(
        "Native coordinate target is outside the selected original half's reach.",
      );
    const rising: boolean = last[component] > first[component];
    if (first[component] === last[component])
      fail("Native coordinate half has no monotone nonzero reach.");
    let best: IResult =
      Math.abs(first[component] - target) <= Math.abs(last[component] - target)
        ? {
            phase: lo,
            point: first,
            residual: first[component] - target,
            iterations: 0,
          }
        : {
            phase: hi,
            point: last,
            residual: last[component] - target,
            iterations: 0,
          };
    if (best.residual === 0) return best;
    let iterations: number = 0;
    for (; iterations < 64; ) {
      const phase: number = (lo + hi) / 2;
      if (phase === lo || phase === hi) break;
      const point: [number, number] = read(phase);
      iterations++;
      const residual: number = point[component] - target;
      if (Math.abs(residual) < Math.abs(best.residual))
        best = { phase, point, residual, iterations };
      if (residual === 0) break;
      if (point[component] < target === rising) lo = phase;
      else hi = phase;
    }
    best.iterations = iterations;
    const allowance: number =
      32 *
      Number.EPSILON *
      Math.max(1, Math.abs(target), ...inputs.extents.map(Math.abs));
    if (
      !(Number.isFinite(best.residual) && Math.abs(best.residual) <= allowance)
    )
      fail(
        "Native coordinate inverse has no admitted original-point residual.",
      );
    return best;
  }
}

/** Numerical failure stays in the existing native admission family. */
function fail(message: string): never {
  throw new AutoMovieLoftAdmissionError(message);
}
