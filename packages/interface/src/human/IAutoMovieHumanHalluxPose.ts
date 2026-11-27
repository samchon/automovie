/**
 * Big toe proximal to distal, degrees. Flexion curls the toe toward the sole;
 * negative flexion is extension, lifting it.
 */
export interface IAutoMovieHumanHalluxPose {
  /**
   * Metatarsophalangeal flexion 45, extension 70 (AAOS). Schema constraints:
   * Minimum: -70; Maximum: 45; retained by Human's schema refinement.
   */
  mtpFlexion?: number;

  /**
   * Metatarsophalangeal abduction away from the second toe, 15 each way
   * (convention). Schema constraints: Minimum: -15; Maximum: 15; retained by
   * Human's schema refinement.
   */
  mtpAbduction?: number;

  /**
   * Interphalangeal flexion, 0 to 90 (recalled, Greene and Heckman 1994).
   * Schema constraints: Minimum: 0; Maximum: 90; retained by Human's schema
   * refinement.
   */
  ipFlexion?: number;
}
