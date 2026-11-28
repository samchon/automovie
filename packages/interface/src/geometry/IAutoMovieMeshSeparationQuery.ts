import type { IAutoMovieMeshSeparationOptions } from "./IAutoMovieMeshSeparationOptions";
import type { IAutoMovieMeshSeparationResult } from "./IAutoMovieMeshSeparationResult";
import type { IAutoMovieMeshSeparationVerdict } from "./IAutoMovieMeshSeparationVerdict";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A compiled resident-surface separation query, returned by
 * `createMeshSeparationQuery`.
 *
 * Supply a nonempty run of finite vertices in the resident XYZ metre frame. The
 * feature is their convex hull. The clearance is finite and nonnegative, and
 * the caller-owned budget has a nonnegative safe integer balance. Full
 * measurement gives the target-capped lower bound and any attachment caps. The
 * decision method stops at the first refuting triangle. Both spend the budget
 * before each counted operation. Invalid numeric inputs are refused before
 * spending. Work that needs another unit at a zero balance throws.
 */
export interface IAutoMovieMeshSeparationQuery {
  /** Measure one feature, including subtrees qualified by their box bounds. */
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
