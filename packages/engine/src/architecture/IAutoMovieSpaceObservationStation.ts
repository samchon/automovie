import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One required interior viewpoint of one logical space.
 *
 * The population is closed and derived: four outward views from the interior
 * centre, four inward views from the corners of its own extent, and one
 * threshold view for every opening on one of its boundaries. A station whose
 * point cannot be placed inside the space keeps its identity and reports a null
 * pose, because a station that disappeared would shrink the denominator exactly
 * where the topology is hardest to read.
 *
 * @evidence requirements/review/subject-inspection.md#review-subject-viewpoint-ownership Enumerates the interior stations a space owes without letting a caller choose them.
 * @evidence specifications/review-and-acceptance/subject-surface-and-inspection.md#review-system-subject-viewpoint-plan Types the interior station and separates its identity from its resolved pose.
 */
export interface IAutoMovieSpaceObservationStation {
  /** Stable station identity inside its space. */
  id: string;
  /** Which of the three interior roles this station answers. */
  role: "center" | "corner" | "threshold";
  /** Opening this threshold station reads, or null for the other roles. */
  opening: string | null;
  /**
   * Where the eye stands and what it looks at, or null when no interior point
   * could be placed for it.
   */
  pose: {
    /** World eye position, proved inside the space's own stated volume. */
    position: IAutoMovieVector3;
    /** Unit view direction. */
    direction: IAutoMovieVector3;
    /** World point the eye is aimed at. */
    target: IAutoMovieVector3;
  } | null;
}
