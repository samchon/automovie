import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One inspection-owned cutting plane: the half-space a section view removes.
 *
 * A building is authored from cutaway drawings and then cannot be looked at the
 * way it was drawn. Standing outside hides the interior, standing inside shows
 * one room, and deleting a wall to look past it edits the production instead of
 * reviewing it. A section plane is the missing third option: the scene is left
 * exactly as compiled and the observer removes a half-space of it.
 *
 * **This is not a field of an authored camera**, and it lives beside the
 * frustum half-spaces rather than inside the scene AST for that reason. A shot
 * is judged on the image it delivers, so an observation made after a wall was
 * removed is a diagram about the production rather than evidence about that
 * image; viewpoint authority for it belongs to inspection, exactly as it
 * already does for a subject review's own angle and distance.
 * `IAutoMovieCamera` states the exclusion and the condition that reopens it.
 *
 * The plane is a point and a normal rather than a signed offset because an
 * authoring agent reaches a cut through geometry it already has — a floor
 * level, a room's content bounds, a wall's face — and a point on that feature
 * plus the direction to throw away is what it can name. An offset would make it
 * solve for a scalar it never measured.
 *
 * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Declares the inspection-owned cut as a coplanar point and a normal naming the removed side, outside any authored camera field.
 * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Types the optional clipping plane that clipping evaluation accepts as an input beside the near, far, and side planes.
 */
export interface IAutoMovieSectionPlane {
  /**
   * A point the plane passes through, world space, metres.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Carries the coplanar point the declared cut is measured from.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Supplies `p0` of the specified signed distance `n·(p − p0)`.
   */
  point: IAutoMovieVector3;

  /**
   * Direction of the half-space that is REMOVED. Need not be unit length: it is
   * normalized on use, and a zero or non-finite vector names no half-space at
   * all, so it is refused rather than read as "keep everything".
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-clipping-range Carries which side of the declared plane the section removes.
   * @evidence specifications/camera-light-and-visibility/visibility-and-image-space-observation.md#clv-clipping-clearance-evaluation Supplies `n` of the specified signed distance `n·(p − p0)`.
   */
  normal: IAutoMovieVector3;
}
