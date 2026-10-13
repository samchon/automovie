import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * One world-axis-aligned placement box with the basis that produced it.
 *
 * An element is measured where the environment's current operating states put
 * it, so a leaf authored open is boxed open. A box may be flat or a single
 * point; it is never inverted.
 *
 * @author Samchon
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
