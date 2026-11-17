/** Wrist, degrees.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Wrist, degrees.
 * @evidence contracts/development/design.md#principled-representation `flexion`: Palmar flexion 80, extension 70 (AAOS). `radialDeviation`: Radial deviation 20, ulnar deviation 30 (recalled, Greene and Heckman 1994).
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanWristPose is the canonical exchange used by IAutoMovieHumanWristPoseSchema, IAutoMovieHumanArmPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `flexion`: Palmar flexion 80, extension 70 (AAOS). `radialDeviation`: Radial deviation 20, ulnar deviation 30 (recalled, Greene and Heckman 1994).
 */
export interface IAutoMovieHumanWristPose {
  /** Palmar flexion 80, extension 70 (AAOS). Schema constraints: Minimum: -70; Maximum: 80; retained by Human's schema refinement. */
  flexion?: number;

  /** Radial deviation 20, ulnar deviation 30 (recalled, Greene and Heckman 1994). Schema constraints: Minimum: -30; Maximum: 20; retained by Human's schema refinement. */
  radialDeviation?: number;
}
