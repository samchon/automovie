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
 * @evidence contracts/common.md#principled-implementation The population is a fixed derivation (four centre views, four corner views, one threshold per opening on a boundary of the space) and an unplaceable eye nulls `pose` instead of removing the entry, so the station count depends only on the record and never on whether placement succeeded.
 * @evidence contracts/common.md#clear-and-simple-design Four fields: an id, a closed three-value role, an opening id that is non-null only for the threshold role, and one nullable pose object holding the three world vectors that always travel together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No role or station id is tied to a particular space or fixture; the null pose is the declared outcome for a station whose eye cannot be put inside the volume, so nothing is dropped or moved outside to make a count agree.
 * @evidence contracts/common.md#meaningful-documentation States the closed population, why an unplaceable station keeps its identity, the id spellings, the threshold-only meaning of `opening`, the world frame of the pose, and that the eye is proved inside the stated volume.
 * @evidenceExclude contracts/performance.md#cost-and-resources A record with no behaviour: the containment tests that place each eye are `builtSpaceObservationStations`'s cost, and a station holds two strings, a role and at most three small vectors with no handle, for as long as the caller keeps its array.
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
   * could be placed for it.
   */
  pose: {
    /** World eye position, proved inside the space's own stated volume. */
    position: IAutoMovieVector3;
    /** Unit world direction from `position` toward `target`. */
    direction: IAutoMovieVector3;
    /** World point the eye is aimed at. */
    target: IAutoMovieVector3;
  } | null;
}
