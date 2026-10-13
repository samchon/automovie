import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * One world-axis-aligned placement box with the basis that produced it.
 *
 * An element is measured where the environment's current operating states put
 * it, so a leaf authored open is boxed open. A box may be flat or a single
 * point; it is never inverted.
 *
 * @evidence contracts/common.md#principled-implementation An axis-aligned box in world metres, taken from tessellated element vertices under the full hierarchy and current operating states, or from a population's conservative placement fold, with the basis recording which.
 * @evidence contracts/common.md#clear-and-simple-design Two corners plus a basis, with no centre or half-extent alternative, are all the overlap and support tests read, so one box shape serves both.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A transform-only group gets no box at all rather than a zero box at its origin, while an element whose vertices the record lacks gets its origin as a point box labelled `element-origin-point`.
 * @evidence contracts/common.md#meaningful-documentation States the inclusive corners, world frame and metre unit, the operating state the box reflects, and that an origin-point basis marks a box without volume.
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
