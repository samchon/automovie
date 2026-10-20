import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * One world-axis-aligned placement box with the basis that produced it.
 *
 * An element is measured at the environment's current operating states. Under finite usable derived arithmetic its box is ordered and can be flat or a point; low-level folds do not independently refuse every transformed NaN or infinity, so finite source values alone do not establish those result invariants.
 *
 * @evidence contracts/common.md#principled-implementation An element box folds static CPU mesh/tessellated vertices under current element-world and part-local transforms, or the world-origin fallback. It excludes skinning, attached-bone motion, other animation, external geometry and GPU arithmetic. A population uses its authored prototype/placement envelope; these bounds require usable binary64 intermediates and are not an outward-rounded rendered-frame enclosure proof.
 * @evidence contracts/common.md#clear-and-simple-design Two corners plus the basis label are the whole answer; the label travels with the box so every overlap and support query built on it can report what kind of extent it measured.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The basis excludes `surface-height-rule` because only body locators resolve to a box, and a vertex-less element is labelled `element-origin-point` instead of being given an invented extent.
 * @evidence contracts/common.md#meaningful-documentation States world metres, inclusive corners, current-state placement, static CPU/prototype measurement limits and finite-result premises. The point basis means equal corners, whether from unavailable geometry or coincident vertices.
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
