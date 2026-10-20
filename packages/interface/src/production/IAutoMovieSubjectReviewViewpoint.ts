import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One inspection-owned viewpoint required by a subject review.
 *
 * @evidence contracts/common.md#principled-implementation A unit direction and positive meter distance define inspection camera placement relative to the subject; coverage admits unique nonblank ids and unit directions within its declared numeric tolerance.
 * @evidence contracts/common.md#clear-and-simple-design Separates viewpoint intent from exact rendered camera pose and receipt so an ordered inspection plan can own the coverage denominator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The coverage fold validates viewpoint ids, unit directions and positive distances, but does not apply projection, pose or state to a camera; these fields express caller-owned inspection intent rather than proving an implemented capture path.
 * @evidence contracts/common.md#meaningful-documentation Defines unique viewpoint id, unit direction, positive distance, projection choice and nullable pose/state identity, with camera application left to the caller.
 */
export interface IAutoMovieSubjectReviewViewpoint {
  /** Stable identity unique inside the plan. */
  id: string;

  /** Unit viewing direction from the subject toward the inspection camera. */
  direction: IAutoMovieVector3;

  /** Positive camera distance in metres. */
  distance: number;

  /** Projection used to inspect this viewpoint. */
  projection: "perspective" | "orthographic";

  /** Inspection pose identity, or null for the subject's rest state. */
  pose: string | null;

  /** Additional inspection state identity, or null when none applies. */
  state: string | null;
}
