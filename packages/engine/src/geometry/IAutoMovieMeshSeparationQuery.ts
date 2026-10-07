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
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Offers composable resident geometry both a complete separation measurement and a decision-only query over one compiled snapshot.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Qualifies complete-feature clearance against original resident triangles in either operation.
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
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Decides a composable feature's clearance without completing work that cannot change the decision.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Applies the same complete-feature qualification and names the first refuting original triangle.
   */
  separated(
    vertices: readonly IAutoMovieVector3[],
    options: IAutoMovieMeshSeparationOptions,
  ): IAutoMovieMeshSeparationVerdict;
}
