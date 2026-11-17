/** Hip joint, degrees.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Hip joint, degrees.
 * @evidence contracts/development/design.md#principled-representation `flexion`: Flexion 132.1, extension 17.75 (measured). `abduction`: Abduction 40, adduction 20 (AAOS). `rotation`: External rotation 45, internal rotation 45 (recalled, Greene and Heckman 1994).
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHipPose is the canonical exchange used by IAutoMovieHumanHipPoseSchema, IAutoMovieHumanLegPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `flexion`: Flexion 132.1, extension 17.75 (measured). `abduction`: Abduction 40, adduction 20 (AAOS). `rotation`: External rotation 45, internal rotation 45 (recalled, Greene and Heckman 1994).
 */
export interface IAutoMovieHumanHipPose {
  /** Flexion 132.1, extension 17.75 (measured). Schema constraints: Minimum: -17.75; Maximum: 132.1; retained by Human's schema refinement. */
  flexion?: number;

  /** Abduction 40, adduction 20 (AAOS). Schema constraints: Minimum: -20; Maximum: 40; retained by Human's schema refinement. */
  abduction?: number;

  /** External rotation 45, internal rotation 45 (recalled, Greene and Heckman 1994). Schema constraints: Minimum: -45; Maximum: 45; retained by Human's schema refinement. */
  rotation?: number;
}
