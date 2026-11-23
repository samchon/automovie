/**
 * The thumb's joints proximal to distal, degrees. Flexion carries the tip
 * across or toward the palm.
 */
export interface IAutoMovieHumanThumbPose {
  /**
   * Carpometacarpal flexion across the palm 15, extension 20 (recalled, Greene
   * and Heckman 1994). Schema constraints: Minimum: -20; Maximum: 15; retained
   * by Human's schema refinement.
   */
  cmcFlexion?: number;

  /**
   * Carpometacarpal palmar abduction away from the palm, 0 to 60 (AAOS). Schema
   * constraints: Minimum: 0; Maximum: 60; retained by Human's schema
   * refinement.
   */
  cmcAbduction?: number;

  /**
   * Carpometacarpal opposition, axial rotation turning the pad toward the
   * fingers, 0 to 45 (convention). Schema constraints: Minimum: 0; Maximum: 45;
   * retained by Human's schema refinement.
   */
  cmcOpposition?: number;

  /**
   * Metacarpophalangeal flexion, 0 to 50 (AAOS). Schema constraints: Minimum:
   * 0; Maximum: 50; retained by Human's schema refinement.
   */
  mcpFlexion?: number;

  /**
   * Interphalangeal flexion, 0 to 80 (AAOS). Schema constraints: Minimum: 0;
   * Maximum: 80; retained by Human's schema refinement.
   */
  ipFlexion?: number;
}
