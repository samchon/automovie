/** Elbow hinge, degrees (measured).
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Elbow hinge, degrees (measured).
 * @evidence contracts/development/design.md#principled-representation `flexion`: Flexion 147.3, hyperextension 2.75.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanElbowPose is the canonical exchange used by IAutoMovieHumanElbowPoseSchema, IAutoMovieHumanArmPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `flexion`: Flexion 147.3, hyperextension 2.75.
 */
export interface IAutoMovieHumanElbowPose {
  /** Flexion 147.3, hyperextension 2.75. Schema constraints: Minimum: -2.75; Maximum: 147.3; retained by Human's schema refinement. */
  flexion?: number;
}
