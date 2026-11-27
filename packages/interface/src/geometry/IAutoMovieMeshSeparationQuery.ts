import type { IAutoMovieMeshSeparationOptions } from "./IAutoMovieMeshSeparationOptions";
import type { IAutoMovieMeshSeparationResult } from "./IAutoMovieMeshSeparationResult";
import type { IAutoMovieMeshSeparationVerdict } from "./IAutoMovieMeshSeparationVerdict";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A compiled resident-surface separation query, returned by
 * `createMeshSeparationQuery`.
 *
 * Calling it measures a feature, a nonempty finite run of XYZ vertices in the
 * resident metre frame taken as its convex hull, against every resident
 * triangle: the target-capped global lower bound, its limiting triangle and any
 * attachment caps. `separated` answers only the clearance decision on the same
 * snapshot through the same walk, ending at the first refuting triangle. Both
 * spend the shared budget before each unit of work they actually perform, and
 * both throw on a malformed feature or options and on budget exhaustion. The
 * hair builder compiles one query over the binary64 skin and one over its
 * Float32 representation.
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
