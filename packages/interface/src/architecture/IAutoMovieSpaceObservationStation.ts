import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One required interior viewpoint of one logical space.
 *
 * Produced by `builtSpaceObservationStations`. The population is closed and
 * derived: four outward views from the interior centre, four inward views from
 * the corners of the space's own extent, and one threshold view for every
 * opening on one of its boundaries, in that order with thresholds sorted by
 * opening id. A space that states no volume owes no station. A station whose
 * point cannot be placed inside the space keeps its identity and reports a null
 * pose, because a station that disappeared would shrink the denominator exactly
 * where the topology is hardest to read.
 */
export interface IAutoMovieSpaceObservationStation {
  /**
   * Stable station identity inside its space: `center-x-minus` and its three
   * siblings, `corner-x-minus-z-minus` and its three siblings, or
   * `threshold-<opening id>`.
   */
  id: string;

  /** Which of the three interior roles this station answers. */
  role: "center" | "corner" | "threshold";

  /** Opening this threshold station reads, or null for the other roles. */
  opening: string | null;

  /**
   * Where the eye stands and what it looks at, or null when no interior point
   * could be placed for it or the eye would coincide with its target.
   */
  pose: {
    /**
     * World eye position in metres, accepted by the space's numerical
     * containment predicate.
     */
    position: IAutoMovieVector3;

    /** Unit world direction from `position` toward `target`. */
    direction: IAutoMovieVector3;

    /** World point the eye is aimed at, in metres. */
    target: IAutoMovieVector3;
  } | null;
}
