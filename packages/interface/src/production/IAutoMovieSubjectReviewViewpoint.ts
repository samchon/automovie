import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One inspection-owned viewpoint required by a subject review.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Gives the inspection an explicit viewpoint independent from authored cameras and film time.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Types one deterministic member of the inspection-owned viewpoint plan.
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
