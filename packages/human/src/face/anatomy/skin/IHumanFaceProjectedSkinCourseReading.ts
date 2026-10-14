/**
 * Extrinsic distance and arc station on one compiled continuous skin course. Equal distance uses the first piece in guide order. Distance is not a geodesic; a nearby second sheet remains inside the relief kernel's reach.
 *
 * @evidence contracts/common.md#principled-implementation Nearest extrinsic course distance and arc-normalized station describe one read point.
 * @evidence contracts/common.md#clear-and-simple-design The reading separates physical proximity from longitudinal attachment position.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It does not identify intrinsic skin distance or disambiguate another nearby sheet within a relief reach.
 * @evidence contracts/common.md#meaningful-documentation Distance uses metres, station uses physical arc fraction, and first retained span settles equal candidates.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Segment projection and arc interpolation execute in readHumanFaceProjectedSkinCourse.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Retained physical spans supply repeated reads without recompiling native features.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only scalar fields belong to the caller and the result retains no course arrays.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinCourseReading {
  /** Euclidean nearest distance, metres, computed without squaring the width. */
  distanceMetres: number;

  /** Nearest arc position divided by total course length, in [0,1]. */
  station: number;
}
