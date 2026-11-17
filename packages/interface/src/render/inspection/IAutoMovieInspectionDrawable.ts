import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3.js";

/**
 * The world-space bounds of drawn geometry and marks at one identity path.
 *
 * A path can collect an object's geometry and its marks. Consumers borrow the record and corner objects without mutation or an ownership transfer; sharing those corners remains permitted. expandAutoMovieInspectionSweep refuses nonfinite or unordered bounds.
 *
 * @evidence contracts/development/design.md#principled-representation An identity path and an axis-aligned box in world metres, the inputs the sweep compares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Scene description, inspection-path measurement and capture sweep planning share path identity and world bounds through this contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `min` not exceeding `max` on any axis is the producer's invariant.
 * @evidence contracts/development/common.md#meaningful-documentation States what each member holds and its frame and unit.
 */
export interface IAutoMovieInspectionDrawable {
  /** Identity path of the object, names joined by `/`. */
  path: string;

  /** Corner of the world-space box with the smallest coordinates, in metres. */
  min: IAutoMovieVector3;

  /** Corner of the world-space box with the largest coordinates, in metres. */
  max: IAutoMovieVector3;
}
