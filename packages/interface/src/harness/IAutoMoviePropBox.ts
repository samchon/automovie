import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One axis-aligned volume in the prop's model frame, in metres: a declared
 * footprint, or the base of a clearance box.
 *
 * `validatePropPlacements` refuses a box whose bounds are not finite with
 * `min < max` on every axis. The engine carries all eight corners through the
 * set piece's staged transform (translation, unit rotation and per-axis scale)
 * and takes the world-axis-aligned bound of the result, so a rotated box widens
 * rather than being re-fitted.
 *
 * @evidence contracts/common.md#principled-implementation `transformedBoxBounds` takes per-axis extrema of eight transformed corners, the exact-real axis-aligned bound of an affine box image. It encloses the rotated volume rather than preserving its orientation; binary64 products/sums can round or overflow even for finite authored bounds and transforms, and this local box gate does not validate the derived world bounds.
 * @evidence contracts/common.md#clear-and-simple-design Two corners describe the volume, and `IAutoMovieClearanceBox` extends this record with an id, so footprints and clearances share one corner rule and one transform.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A flat, inverted or non-finite box is refused rather than widened by a tolerance or reordered.
 * @evidence contracts/common.md#meaningful-documentation States the frame and unit, where the box is used, the corner rule and its validator, and how staging transforms it; members give each corner's role and bound.
 * @author Samchon
 */
export interface IAutoMoviePropBox {
  /** Model-local minimum corner. */
  min: IAutoMovieVector3;

  /** Model-local maximum corner, strictly greater on every axis. */
  max: IAutoMovieVector3;
}
