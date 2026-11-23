/** Wrist, degrees. */
export interface IAutoMovieHumanWristPose {
  /**
   * Palmar flexion 80, extension 70 (AAOS). Schema constraints: Minimum: -70;
   * Maximum: 80; retained by Human's schema refinement.
   */
  flexion?: number;

  /**
   * Radial deviation 20, ulnar deviation 30 (recalled, Greene and Heckman
   * 1994). Schema constraints: Minimum: -30; Maximum: 20; retained by Human's
   * schema refinement.
   */
  radialDeviation?: number;
}
