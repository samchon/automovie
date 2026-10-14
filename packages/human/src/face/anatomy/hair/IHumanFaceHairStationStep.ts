import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One step of a hair lock: the next station and the travel that reached it.
 *
 * The current metric walker uses this record for its accepted chord and charges actual `distance` against remaining length. The standalone `launchHumanFaceHairCurve` also returns this shape, but it currently has no repository execution caller. A chord that does not exceed contact epsilon is refused by the walk.
 *
 * @evidence contracts/common.md#principled-implementation A next station and actual chord distance represent one accepted step of the metric hair walk.
 * @evidence contracts/common.md#clear-and-simple-design Launch and later integration steps use the same point-and-travel result.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A step not exceeding contact epsilon is refused by the walk rather than billed as useful progress.
 * @evidence contracts/common.md#meaningful-documentation distance is measured metres from the previous station, and point uses the current head frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Launch or integration computes progress; the result type chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The integrator uses the measured distance for both length accounting and station progress.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the next point and no historical point list is retained by this type.
 *
 * @author Samchon
 */
export interface IHumanFaceHairStationStep {
  /** The next station position. */
  point: IAutoMovieVector3;

  /** Chord length from the previous station to `point`, in metres. */
  distance: number;
}
