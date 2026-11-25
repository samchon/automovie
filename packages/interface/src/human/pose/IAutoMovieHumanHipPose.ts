/** Hip joint, degrees. */
export interface IAutoMovieHumanHipPose {
  /**
   * Flexion 132.1, extension 17.75 (measured). Schema constraints: Minimum:
   * -17.75; Maximum: 132.1; retained by Human's schema refinement.
   */
  flexion?: number;

  /**
   * Abduction 40, adduction 20 (AAOS). Schema constraints: Minimum: -20;
   * Maximum: 40; retained by Human's schema refinement.
   */
  abduction?: number;

  /**
   * External rotation 45, internal rotation 45 (recalled, Greene and Heckman
   * 1994). Schema constraints: Minimum: -45; Maximum: 45; retained by Human's
   * schema refinement.
   */
  rotation?: number;
}
