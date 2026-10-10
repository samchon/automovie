/**
 * Extrinsic distance and arc station on one compiled continuous skin course.
 * Equal distance uses the first piece in guide order. Distance is not a
 * geodesic; a nearby second sheet remains inside the relief kernel's reach.
 *
 * @author Samchon
 */
export interface IHumanFaceProjectedSkinCourseReading {
  /** Euclidean nearest distance, metres, computed without squaring the width. */
  distanceMetres: number;

  /** Nearest arc position divided by total course length, in [0,1]. */
  station: number;
}
