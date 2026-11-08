import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Axis-aligned box in the coordinate frame of its owning result.
 *
 * @evidence contracts/development/design.md#principled-representation Soft surfaces bound indexed world vertices, growPlanting bounds recipe-frame stem radial support and transformed leaf-card corners, and cluster arrangement bounds world placement origins; each producer owns the included geometry and frame. These scalar envelopes do not certify GPU appearance or arbitrary room-union containment.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A paired minimum and maximum expresses one box; empty producers return a nullable box rather than independently missing corners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This record does not claim all producers measure the same geometry or inflate a box into a collision certificate.
 * @evidence contracts/development/common.md#meaningful-documentation The owning result determines the frame and measured extent; corner coordinates share that frame and metre units.
 */
export interface IAutoMovieSoftBounds {
  /** Minimum corner. */
  min: IAutoMovieVector3;

  /** Maximum corner. */
  max: IAutoMovieVector3;
}
