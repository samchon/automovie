import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Axis-aligned box in the coordinate frame of its owning result.
 *
 * @evidence contracts/common.md#principled-implementation Soft surface derivation bounds indexed world-space vertices, growPlanting bounds recipe-frame branch endpoints and cluster arrangement bounds world placement origins; each producer supplies the frame and included geometry.
 * @evidence contracts/common.md#clear-and-simple-design A paired minimum and maximum expresses one box; empty producers return a nullable box rather than independently missing corners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This record does not claim all producers measure the same geometry or inflate a box into a collision certificate.
 * @evidence contracts/common.md#meaningful-documentation The owning result determines the frame and measured extent; corner coordinates share that frame and metre units.
 * @author Samchon
 */
export interface IAutoMovieSoftBounds {
  /** Minimum corner. */
  min: IAutoMovieVector3;

  /** Maximum corner. */
  max: IAutoMovieVector3;
}
