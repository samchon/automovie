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
 * @evidence contracts/development/common.md#meaningful-documentation Coordinates/targets use kernel mm, returned phase uses original radians, half refers to the other coordinate's sign, and endpoint Point0 does not imply a regular inverse derivative.
 * @evidence contracts/development/design.md#principled-representation Represents Locate an original native coordinate on one declared monotone half profile: companion namespace of 2 members (`IResult`, `locate`); units and frames named in its text: radians, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieNativeCoordinate` in packages/engine/src/geometry/construction/AutoMovieNativeCoordinate.ts; its surface is the 2 members listed and the text shows 8 other files naming it, mostly packages/human (6), packages/engine (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieNativeCoordinate {
  /**
   * Exact original point and observed finite numerical inverse residual.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Exact original point and observed finite numerical inverse residual.
   * @evidence contracts/development/design.md#principled-representation Represents Exact original point and observed finite numerical inverse residual: interface of 4 members (`phase`, `point`, `residual`, `iterations`); units and frames named in its text: radians, local. It has no optional member, so no absent-value state combines with another.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IResult` in packages/engine/src/geometry/construction/AutoMovieNativeCoordinate.ts; its surface is the 4 members listed and the text shows 176 other files naming it, mostly packages/human (64), test (54), movies (27), so no member is declared for a presumed future need.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
   */
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents the member contract in its own summary: Solve local x (component0) or z (component1) on a positive/negative other-coordinate half.
   * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Solve local x (component0) or z (component1) on a positive/negative other-coordinate half) directly over its typed inputs (`inputs`, `component`, `half`, `target`) as 2 sequential passes (for loop bounded by iterations < 64; map over inputs.extents), delegating to `Number.isFinite`, `fail`, `AutoMovieLoftSectionNative.point`, `read`, `Math.min`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 64, 32, whose basis this answer does not independently establish and a reviewer must confirm.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 73 lines and 17 top-level statements that reuses `Number.isFinite`, `fail`, `AutoMovieLoftSectionNative.point`, `read`, `Math.min` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 64, 32 are not independently sourced here.
   * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `inputs`, `component`, `half`, `target`; the dominant cost is 2 sequential passes (for loop bounded by iterations < 64; map over inputs.extents), performed once per call with 3 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 3 allocation sites become the returned value or die with the call, so nothing grows.
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
