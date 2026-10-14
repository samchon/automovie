import { IAutoMovieVector3 } from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation The population is a closed function of the space's stated volume and the openings on its boundaries, so a review's denominator is derived from the record and a station that cannot be placed stays counted with a null pose.
 * @evidence contracts/common.md#clear-and-simple-design An id, a role, the threshold's opening and one nullable pose, which is what a review needs to aim a camera and to count coverage; placement rules live in the producer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unplaceable stations are reported with a null pose rather than dropped or moved outside the space, so a hard topology never shrinks its own denominator.
 * @evidence contracts/common.md#meaningful-documentation States producer, station roles/order, volume-less exclusion, identities and nullable pose. Every returned eye passes the producer's numerical containment predicate, and aim requires finite non-negligible length; these are numerical checks rather than exact-real certificates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record without behavior; placing stations costs the containment probes of `builtSpaceObservationStations`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Describes one station of one call; the producer recomputes the population from the record each time.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owns three small vectors at most; the caller's station list owns it and is bounded by eight plus the space's opening count.
 * @author Samchon
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
    /** World eye position in metres, accepted by the space's numerical containment predicate. */
    position: IAutoMovieVector3;

    /** Unit world direction from `position` toward `target`. */
    direction: IAutoMovieVector3;

    /** World point the eye is aimed at, in metres. */
    target: IAutoMovieVector3;
  } | null;
}
