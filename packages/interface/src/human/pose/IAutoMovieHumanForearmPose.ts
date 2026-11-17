/**
 * Forearm rotation from the mid position, degrees (measured). At neutral the
 * arms hang at the sides with the thumbs forward, so 0 is thumbs forward and
 * not palms forward; full supination turns the palms forward.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Forearm rotation from the mid position, degrees (measured).
 * @evidence contracts/development/design.md#principled-representation `pronation`: Pronation (palm turned down) 79.45, supination 87.8.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanForearmPose is the canonical exchange used by IAutoMovieHumanForearmPoseSchema, IAutoMovieHumanArmPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `pronation`: Pronation (palm turned down) 79.45, supination 87.8.
 */
export interface IAutoMovieHumanForearmPose {
  /** Pronation (palm turned down) 79.45, supination 87.8. Schema constraints: Minimum: -87.8; Maximum: 79.45; retained by Human's schema refinement. */
  pronation?: number;
}
