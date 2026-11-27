import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One inspection-owned cutting plane: the half-space a section view removes.
 *
 * A building is authored from cutaway drawings and then cannot be looked at the
 * way it was drawn. Standing outside hides the interior, standing inside shows
 * one room, and deleting a wall to look past it edits the production instead of
 * reviewing it. A section plane leaves the scene exactly as compiled and lets
 * the observer remove a half-space of it.
 *
 * It is not a field of an authored camera. A shot is judged on the image it
 * delivers, so an observation made after a wall was removed is a diagram about
 * the production rather than evidence about that image; `IAutoMovieCamera`
 * states the exclusion and the condition that reopens it.
 * `sectionPlaneDistance`, `sectionPlanesKeepPoint` and
 * `classifySectionPlaneBox` evaluate it, and the viewer's
 * `applySectionPlanes` hands the same plane to `three.js` clipping.
 */
export interface IAutoMovieSectionPlane {
  /** A point the plane passes through, in world space, metres; finite. */
  point: IAutoMovieVector3;

  /**
   * Direction of the half-space that is removed. It need not be unit length,
   * because it is normalized on use, but it must be finite and non-zero: such a
   * vector names no half-space, so it is refused rather than read as "keep
   * everything".
   */
  normal: IAutoMovieVector3;
}
