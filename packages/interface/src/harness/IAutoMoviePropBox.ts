import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One axis-aligned volume in the prop's model frame, in metres: a declared
 * footprint, or the base of a clearance box.
 *
 * `validatePropPlacements` refuses a box whose bounds are not finite with `min
 * < max` on every axis. The engine carries all eight corners through the set
 * piece's staged transform (translation, unit rotation and per-axis scale) and
 * takes the world-axis-aligned bound of the result, so a rotated box widens
 * rather than being re-fitted.
 */
export interface IAutoMoviePropBox {
  /** Model-local minimum corner. */
  min: IAutoMovieVector3;

  /** Model-local maximum corner, strictly greater on every axis. */
  max: IAutoMovieVector3;
}
