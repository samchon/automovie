/**
 * Lumbar spine, L1 to S1, degrees (convention split of the recalled
 * thoracolumbar totals).
 */
export interface IAutoMovieHumanLumbarPose {
  /**
   * Forward bend 50, backward bend 15. Schema constraints: Minimum: -15;
   * Maximum: 50; retained by Human's schema refinement.
   */
  flexion?: number;

  /**
   * Side bend, 20 each way; positive toward the person's left. Schema
   * constraints: Minimum: -20; Maximum: 20; retained by Human's schema
   * refinement.
   */
  lateralFlexion?: number;

  /**
   * Axial rotation, 5 each way; positive turns the front toward the left.
   * Schema constraints: Minimum: -5; Maximum: 5; retained by Human's schema
   * refinement.
   */
  rotation?: number;
}
