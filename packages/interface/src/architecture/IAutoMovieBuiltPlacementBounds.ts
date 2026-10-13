import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * One world-axis-aligned placement box with the basis that produced it.
 *
 * An element is measured where the environment's current operating states put
 * it, so a leaf authored open is boxed open. A box may be flat or a single
 * point; it is never inverted.
 *
 * @evidence contracts/common.md#principled-implementation An element box is the axis-aligned fold of every tessellated vertex its model draws under the full hierarchy and current operation displacements, and a population box is the conservative envelope of its prototype bounds under the set's placement law; both are inclusive, so a flat or point box stays valid rather than inverted.
 * @evidence contracts/common.md#clear-and-simple-design Two corners plus the basis label are the whole answer; the label travels with the box so every overlap and support query built on it can report what kind of extent it measured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis excludes `surface-height-rule` because only body locators resolve to a box, and a vertex-less element is labelled `element-origin-point` instead of being given an invented extent.
 * @evidence contracts/common.md#meaningful-documentation States the world frame, metre units, inclusive corners, that operating states are applied, that a box may be flat or a point but never inverted, and that `element-origin-point` means no extent.
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
