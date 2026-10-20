import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One deterministically derived tapered branch segment after growth and pruning.
 *
 * @evidence contracts/common.md#principled-implementation The growth traversal emits path-qualified branch identity, parent and level with clipped recipe-frame endpoints and contracted radii; pruning cuts at analytic envelope intersections.
 * @evidence contracts/common.md#clear-and-simple-design One segment record serves rendering and quantity inspection without storing a separate visual branch hierarchy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Pruned reports an actual shortened branch rather than a renderer-only invisible tail, and missing branches beyond the envelope are not emitted as zero-length fabricated growth.
 * @evidence contracts/common.md#meaningful-documentation Defines stable path identity, hierarchy and level, recipe-meter endpoints, radii and pruning effect.
 */
export interface IAutoMoviePlantingBranch {
  /**
   * Stable branch identity, derived from the path of child ids that made it.
   */
  id: string;

  /** Id of the branch this one emerges from, or `null` for the trunk. */
  parent: string | null;

  /** Recursion level; `0` is the trunk. */
  level: number;

  /** Recipe-frame position of the base. */
  start: IAutoMovieVector3;

  /** Recipe-frame position of the tip, after growth and pruning. */
  end: IAutoMovieVector3;

  /** Radius in metres at the base. */
  radiusStart: number;

  /** Radius in metres at the tip. */
  radiusEnd: number;

  /** Whether the pruning envelope cut this segment short. */
  pruned: boolean;
}
