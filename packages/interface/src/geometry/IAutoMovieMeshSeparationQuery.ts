import type { IAutoMovieMeshSeparationOptions } from "./IAutoMovieMeshSeparationOptions";
import type { IAutoMovieMeshSeparationResult } from "./IAutoMovieMeshSeparationResult";
import type { IAutoMovieMeshSeparationVerdict } from "./IAutoMovieMeshSeparationVerdict";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A compiled resident-surface separation query, returned by
 * `createAutoMovieMeshSeparationQuery`.
 *
 * Calling it measures a feature, a nonempty finite run of XYZ vertices in the
 * resident metre frame taken as its convex hull, against every resident
 * triangle: the target-capped global lower bound, its limiting triangle and
 * any attachment caps. `separated` answers only the clearance decision on the
 * same snapshot through the same walk, ending at the first refuting triangle.
 * Both spend the shared budget before each unit of work they actually
 * perform, and both throw on a malformed feature or options and on budget
 * exhaustion. The hair builder compiles one query over the binary64 skin and
 * one over its Float32 representation.
 *
 * @evidence contracts/development/design.md#principled-representation Both operations run one private walk over a median-split box hierarchy, pruning a box whose axis projections already prove the target and bounding each remaining triangle with `boundAutoMovieConvexSeparation`; because the running bound starts at the target and only falls, stopping at the first refutation cannot change certification.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A callable object with one method keeps the full measurement and the cheaper decision on the same compiled snapshot, so a caller cannot pair a verdict with a measurement taken over a different surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No box or triangle is skipped by distance sampling, a nearest corner or a spatial tolerance; a box is pruned only by an outward-rounded projection proof, and a refusal or exhaustion throws instead of returning a guess.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, what a feature is and its frame, what each operation returns, the shared budget and refusals, and the two representations the hair builder compiles.
 */
export interface IAutoMovieMeshSeparationQuery {
  /** Measure one feature completely against every resident triangle. */
  (
    vertices: readonly IAutoMovieVector3[],
    options: IAutoMovieMeshSeparationOptions,
  ): IAutoMovieMeshSeparationResult;

  /**
   * Decide whether one feature is separated by the requested clearance,
   * stopping at the first refuting triangle. Its `certified` equals the full
   * measurement's for the same feature and options, and it spends no more
   * budget than the full measurement would.
   */
  separated(
    vertices: readonly IAutoMovieVector3[],
    options: IAutoMovieMeshSeparationOptions,
  ): IAutoMovieMeshSeparationVerdict;
}
