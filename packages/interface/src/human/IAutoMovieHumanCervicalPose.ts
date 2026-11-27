/**
 * Lower cervical spine, C2 to C7, degrees: the AAOS cervical totals less the
 * two cranio-vertebral joints.
 */
export interface IAutoMovieHumanCervicalPose {
  /**
   * Forward bend 35, backward bend 30. Schema constraints: Minimum: -30;
   * Maximum: 35; retained by Human's schema refinement.
   */
  flexion?: number;

  /**
   * Side bend, 40 each way; positive toward the person's left. Schema
   * constraints: Minimum: -40; Maximum: 40; retained by Human's schema
   * refinement.
   */
  lateralFlexion?: number;

  /**
   * Axial rotation, 20 each way; positive turns the face toward the left.
   * Schema constraints: Minimum: -20; Maximum: 20; retained by Human's schema
   * refinement.
   */
  rotation?: number;
}
