import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3.js";

/**
 * The world-space bounds of drawn geometry and marks at one identity path.
 *
 * A path can collect an object's geometry and its marks. Consumers borrow the
 * record and corner objects without mutation or an ownership transfer; sharing
 * those corners remains permitted. expandAutoMovieInspectionSweep refuses
 * nonfinite or unordered bounds.
 */
export interface IAutoMovieInspectionDrawable {
  /** Identity path of the object, names joined by `/`. */
  path: string;

  /** Corner of the world-space box with the smallest coordinates, in metres. */
  min: IAutoMovieVector3;

  /** Corner of the world-space box with the largest coordinates, in metres. */
  max: IAutoMovieVector3;
}
