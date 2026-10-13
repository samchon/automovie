import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieMeshSeparationOptions } from "./IAutoMovieMeshSeparationOptions";
import type { IAutoMovieMeshSeparationResult } from "./IAutoMovieMeshSeparationResult";
import type { IAutoMovieMeshSeparationVerdict } from "./IAutoMovieMeshSeparationVerdict";

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
 * @evidence contracts/common.md#principled-implementation Both operations run one private walk over a median-split box hierarchy, pruning a box whose axis projections already prove the target and bounding each remaining triangle with `boundAutoMovieConvexSeparation`; because the running bound starts at the target and only falls, stopping at the first refutation cannot change certification.
 * @evidence contracts/common.md#clear-and-simple-design A callable object with one method keeps the full measurement and the cheaper decision on the same compiled snapshot, so a caller cannot pair a verdict with a measurement taken over a different surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No box or triangle is skipped by distance sampling, a nearest corner or a spatial tolerance; a box is pruned only by an outward-rounded projection proof, and a refusal or exhaustion throws instead of returning a guess.
 * @evidence contracts/common.md#meaningful-documentation States the producer, what a feature is and its frame, what each operation returns, the shared budget and refusals, and the two representations the hair builder compiles.
 * @evidence contracts/performance.md#efficient-algorithms Box pruning makes a query read only triangles whose boxes do not already prove the target, and each triangle bound stops at its first sufficient direction; worst case is every node plus every triangle, each at cost up to quartic in the feature's vertex count, all capped by the budget.
 * @evidence contracts/performance.md#reuse-equivalent-work The snapshot, its per-triangle boxes and the hierarchy are compiled once and reused by every call and by both operations; reuse of whole verdicts across identical rows is the ribbon fit's cache keyed on exact coordinates, clearance and attachment presence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The query retains two copies of each triangle's corners (represented and binary64 reference), its box and centre, a map from ordinal to triangle, and the hierarchy, all sized by the resident triangle count at compile time and released when the caller drops the query.
 * @author Samchon
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
   *
   * @evidence contracts/common.md#principled-implementation Runs the full measurement's walk with refutation on, returning once the running bound drops below the target; since the bound only decreases, no later triangle could restore certification, so the decision is exact.
   * @evidence contracts/common.md#clear-and-simple-design A method on the compiled query rather than a separate compile, because hair fitting asks this yes-or-no for every candidate row and shaft ring and needs only the decision and one witness.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The early exit removes only work that cannot change the answer; admission, attachment checks and per-triangle bounds are the same calls the full measurement makes.
   * @evidence contracts/common.md#meaningful-documentation States what is decided, when it stops, that it agrees with the full measurement, and that it never costs more budget than the full measurement.
   * @evidence contracts/performance.md#efficient-algorithms Ends the walk at the first triangle or attachment support that refutes the target, so an unseparated feature usually costs a few leaves; a certified feature still pays the full pruned walk because every box must prove the target.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call decides one feature; equivalent rows are deduplicated by the ribbon fit before calling, and the query keeps no verdict cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates one walk's support set and cap list plus the two-field verdict; all but the verdict are dropped on return and the snapshot is only read.
   */
  separated(
    vertices: readonly IAutoMovieVector3[],
    options: IAutoMovieMeshSeparationOptions,
  ): IAutoMovieMeshSeparationVerdict;
}
