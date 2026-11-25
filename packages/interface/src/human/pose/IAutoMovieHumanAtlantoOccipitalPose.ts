/**
 * Atlanto-occipital joint, skull on C1, degrees (recalled, White and Panjabi
 * 1990).
 */
export interface IAutoMovieHumanAtlantoOccipitalPose {
  /**
   * Nod: chin-in flexion 10, chin-up extension 15. Schema constraints: Minimum:
   * -15; Maximum: 10; retained by Human's schema refinement.
   */
  flexion?: number;

  /**
   * Head tilt, 5 each way; positive toward the person's left. Schema
   * constraints: Minimum: -5; Maximum: 5; retained by Human's schema
   * refinement.
   */
  lateralFlexion?: number;
}
