import { AutoMoviePeriodicCubic } from "@automovie/engine";

/** Read a conservative range for periodic Human rail controls. */
export namespace AutoMovieHumanPeriodicRailRange {
  /**
   * Conservative complete range of the existing periodic cubic, in its control units.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the engine's same prepared 64-sweep cubic through its local outward Bernstein hull, rounded phase-cell support and separate literal-reader allowance. This encloses the computed reader without replacing it by a global curvature excursion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The existing Human tuple API delegates range admission to the engine owner shared with NaturalSpline.periodic.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No margin/clamp changes the rail; overshoot remains a failing source-domain requirement.
   * @evidence contracts/development/common.md#meaningful-documentation Names source units and the actual computed cubic's outward local bound, distinguishes it from tight extrema and preserves explicit nonfinite-proof refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms One engine preparation costs O(64m) and its range conversion O(m), without spline sampling or root search. A root needing both capabilities shares preparation directly at the engine API.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure range request coordinates no effects or cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Preparation and interval temporaries are released after this synchronous call; only the returned two bounds survive.
   */
  export function of(
    values: readonly number[],
  ): readonly [number, number] {
    if (values.length < 3 || !values.every(Number.isFinite))
      throw new Error("periodic rail needs at least three finite controls");
    return AutoMoviePeriodicCubic.create(values).range();
  }
}
