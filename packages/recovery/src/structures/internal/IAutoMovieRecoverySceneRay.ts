/**
 * One actual registered camera's world-frame point direction.
 *
 * @evidence contracts/development/design.md#principled-representation A retained registered source index accompanies its normalized centre-to-point vector for actual pairwise parallax.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One named internal record avoids assuming seed visibility for a new point.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It carries no inferred occlusion or unregistered camera direction.
 * @evidence contracts/development/common.md#meaningful-documentation Members state source order, normalization and coordinate frame.
 */
export interface IAutoMovieRecoverySceneRay {
  /** Index in the original source array. */
  view: number;

  /** Three unit direction coefficients in the common world frame. */
  unit: number[];
}
