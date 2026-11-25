/**
 * Thoracic spine, T1 to T12, degrees (convention split of the recalled
 * thoracolumbar totals).
 */
export interface IAutoMovieHumanThoracicPose {
  /**
   * Forward bend 30, backward bend 10. Schema constraints: Minimum: -10;
   * Maximum: 30; retained by Human's schema refinement.
   */
  flexion?: number;

  /**
   * Side bend, 15 each way; positive toward the person's left. Schema
   * constraints: Minimum: -15; Maximum: 15; retained by Human's schema
   * refinement.
   */
  lateralFlexion?: number;

  /**
   * Axial rotation, 40 each way; positive turns the front toward the left.
   * Schema constraints: Minimum: -40; Maximum: 40; retained by Human's schema
   * refinement.
   */
  rotation?: number;
}
