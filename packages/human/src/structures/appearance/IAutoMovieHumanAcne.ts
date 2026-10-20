import { tags } from "typia";

/**
 * Authorable inflamed spot field with the same deterministic physical-domain distribution as freckles.
 */
export interface IAutoMovieHumanAcne {
  /** Expected spot intersections per square centimetre of a locally planar surface, 0 to 10. */
  density: number & tags.Minimum<0> & tags.Maximum<10>;

  /** Maximum inflamed spot diameter in rest-surface millimetres, 3 to 10. */
  diameterMm: number & tags.Minimum<3> & tags.Maximum<10>;

  /** Redness coverage and shallow papule slope, 0 to 1; the appearance convention limits requested relief to 0.25 mm, without a silhouette-shape control. */
  severity: number & tags.Minimum<0> & tags.Maximum<1>;
}
