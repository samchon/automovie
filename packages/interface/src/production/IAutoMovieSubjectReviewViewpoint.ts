import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One inspection-owned viewpoint required by a subject review.
 *
 * @evidence contracts/common.md#principled-implementation A unit direction and positive meter distance define inspection camera placement relative to the subject; coverage admits unique nonblank ids and unit directions within its declared numeric tolerance.
 * @evidence contracts/common.md#clear-and-simple-design Separates viewpoint intent from exact rendered camera pose and receipt so an ordered inspection plan can own the coverage denominator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Current production plans emit perspective, null pose and null state only; orthographic projection and named inspection states are schema vocabulary with no current host producer, not promises of an implemented pose switch.
 * @evidence contracts/common.md#meaningful-documentation Defines unique viewpoint id, unit direction, positive distance, projection choice and nullable pose/state identity with current producer limits.
 * @author Samchon
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
