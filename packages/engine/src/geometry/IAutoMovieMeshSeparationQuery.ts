import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieMeshSeparationOptions } from "./IAutoMovieMeshSeparationOptions";
import type { IAutoMovieMeshSeparationResult } from "./IAutoMovieMeshSeparationResult";
import type { IAutoMovieMeshSeparationVerdict } from "./IAutoMovieMeshSeparationVerdict";

/**
 * A compiled resident-surface separation query, returned by
 * `createAutoMovieMeshSeparationQuery`.
 *
 * Calling it measures a feature completely: the target-capped global lower
 * bound, its limiting triangle and any attachment caps. `separated` answers
 * only the clearance decision on the same snapshot through the same walk,
 * ending at the first refuting triangle. Both spend the shared budget before
 * each unit of work they actually perform.
 *
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
   * measurement's for the same feature and options.
   */
  separated(
    vertices: readonly IAutoMovieVector3[],
    options: IAutoMovieMeshSeparationOptions,
  ): IAutoMovieMeshSeparationVerdict;
}
