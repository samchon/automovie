/** Knee, degrees. */
export interface IAutoMovieHumanKneePose {
  /**
   * Flexion 139.8, hyperextension 1.3 (measured). Schema constraints: Minimum:
   * -1.3; Maximum: 139.8; retained by Human's schema refinement.
   */
  flexion?: number;

  /**
   * Tibial rotation, external 35 and internal 25 (convention). With range
   * clamping enabled, the evaluator multiplies these bounds by flexion / 90
   * clamped to [0, 1], using admitted knee flexion. A straight or hyperextended
   * knee then has zero rotational range; flexion of at least 90 degrees uses
   * the full range. Schema constraints: Minimum: -25; Maximum: 35; retained by
   * Human's schema refinement.
   */
  rotation?: number;
}
