/**
 * One actual registered camera's world-frame point direction.
 *
 * @evidence contracts/common.md#principled-implementation A retained registered source index accompanies its normalized centre-to-point vector for actual pairwise parallax.
 * @evidence contracts/common.md#clear-and-simple-design One named internal record avoids assuming seed visibility for a new point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It carries no inferred occlusion or unregistered camera direction.
 * @evidence contracts/common.md#meaningful-documentation Members state source order, normalization and coordinate frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased record performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The point qualifier computes each vector once for all pair comparisons.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Call-local numeric arrays acquire no resource.
 */
export interface IAutoMovieRecoverySceneRay {
  /** Index in the original source array. */
  view: number;

  /** Three unit direction coefficients in the common world frame. */
  unit: number[];
}
