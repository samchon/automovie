import { tags } from "typia";

/**
 * Authorable inflamed spot field, sampled on the rest surface like freckles but concentrated on the face and, less, the upper chest and back.
 */
export interface IAutoMovieHumanAcne {
  /** Expected spots per square centimetre of rest surface on the face, 0 to 10. */
  density: number & tags.Minimum<0> & tags.Maximum<10>;

  /** Maximum inflamed spot diameter in rest-surface millimetres, 3 to 10. */
  diameterMm: number & tags.Minimum<3> & tags.Maximum<10>;

  /** Redness coverage, 0 to 1; spots are drawn as colour only, without papule relief or a silhouette-shape control. */
  severity: number & tags.Minimum<0> & tags.Maximum<1>;
}
