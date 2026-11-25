/**
 * One finger's joints proximal to distal, degrees. Flexion carries the tip
 * toward the palm; AAOS flexion norms with extension 0 (Richard and Parry).
 */
export interface IAutoMovieHumanFingerPose {
  /**
   * Metacarpophalangeal flexion, 0 to 80. Schema constraints: Minimum: 0;
   * Maximum: 80; retained by Human's schema refinement.
   */
  mcpFlexion?: number;

  /**
   * Metacarpophalangeal abduction away from the middle finger (the middle
   * finger: toward the thumb), 20 each way (convention). Schema constraints:
   * Minimum: -20; Maximum: 20; retained by Human's schema refinement.
   */
  mcpAbduction?: number;

  /**
   * Proximal interphalangeal flexion, 0 to 90. Schema constraints: Minimum: 0;
   * Maximum: 90; retained by Human's schema refinement.
   */
  pipFlexion?: number;

  /**
   * Distal interphalangeal flexion, 0 to 65. Schema constraints: Minimum: 0;
   * Maximum: 65; retained by Human's schema refinement.
   */
  dipFlexion?: number;
}
