import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import { AutoMovieBuiltPlacementBasis } from "./AutoMovieBuiltPlacementBasis";

/**
 * One world-axis-aligned placement box with the basis that produced it.
 *
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Exposes the measurable placement extent project source needs before it can review support or overlap.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Preserves whether element geometry, a compact population placement, or an extent-free stated origin produced the box.
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
