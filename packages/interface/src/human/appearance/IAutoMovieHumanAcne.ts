/**
 * Authorable inflamed spot field, sampled on the rest surface like freckles but
 * concentrated on the face and, less, the upper chest and back.
 */
export interface IAutoMovieHumanAcne {
  /**
   * Expected spots per square centimetre of rest surface on the face, 0 to 10.
   * Schema constraints: Minimum: 0; Maximum: 10; retained by Human's schema
   * refinement.
   */
  density: number;

  /**
   * Maximum inflamed spot diameter in rest-surface millimetres, 3 to 10. Schema
   * constraints: Minimum: 3; Maximum: 10; retained by Human's schema
   * refinement.
   */
  diameterMm: number;

  /**
   * Redness coverage, 0 to 1; spots are drawn as colour only, without papule
   * relief or a silhouette-shape control. Schema constraints: Minimum: 0;
   * Maximum: 1; retained by Human's schema refinement.
   */
  severity: number;
}
