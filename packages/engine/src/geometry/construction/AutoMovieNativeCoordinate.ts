import type {
  IAutoMovieLoftViewRead,
  IAutoMovieNativeCoordinate,
} from "@automovie/interface";

import { AutoMovieLoftAdmissionError } from "./AutoMovieLoftAdmissionError";
import { AutoMovieLoftSectionNative } from "./AutoMovieLoftSectionNative";

/**
 * Locate an original native coordinate on one declared monotone half profile.
 *
 * Positive rational conic weights and ordered G2 control coordinates make each
 * quarter monotone in each local coordinate in real arithmetic. Selecting the
 * sign of the other coordinate joins the two quarters of one unique half;
 * support extrema are explicit endpoint cases, not regular inverse jets.
 * Numeric native preparation/query failures remain observable. This Point0
 * inverse supplies no physical/station derivative or global float certificate.
 */
export namespace AutoMovieNativeCoordinate {
  /**
   * Solve local x (component0) or z (component1) on a positive/negative
   * other-coordinate half. A residual within32eps*max(1,input extents,target)
   * is the numeric acceptance criterion, not an enclosure proof for every
   * floating-point implementation.
   */
  export function locate(
    inputs: IAutoMovieLoftViewRead.IValues,
    component: 0 | 1,
    half: 1 | -1,
    target: number,
  ): IAutoMovieNativeCoordinate.IResult {
    if (
      (component !== 0 && component !== 1) ||
      (half !== 1 && half !== -1)
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
    let best: IAutoMovieNativeCoordinate.IResult =
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
      !(Math.abs(best.residual) <= allowance)
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
