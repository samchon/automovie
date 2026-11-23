import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * One world-axis-aligned placement box with the basis that produced it.
 *
 * An element is measured at the environment's current operating states. Under
 * finite usable derived arithmetic its box is ordered and can be flat or a
 * point; low-level folds do not independently refuse every transformed NaN or
 * infinity, so finite source values alone do not establish those result
 * invariants.
 */
export interface IAutoMovieBuiltPlacementBounds {
  /** Inclusive world-space minimum corner, in metres. */
  min: IAutoMovieVector3;

  /** Inclusive world-space maximum corner, in metres. */
  max: IAutoMovieVector3;

  /**
   * The derivation used to obtain this box. `element-origin-point` marks a box
   * with no extent, so read it before treating the corners as a volume.
   */
  basis: Exclude<AutoMovieBuiltPlacementBasis, "surface-height-rule">;
}
