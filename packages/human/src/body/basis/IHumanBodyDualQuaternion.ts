import type { IAutoMovieQuaternion } from "@automovie/interface";

/**
 * One rigid transform as a unit dual quaternion `real + ε dual`, the blend element of `skinHumanBodySurface`.
 *
 * @evidence contracts/common.md#principled-implementation Real rotation and half-translation quaternion product encode one rigid transform for the existing dual-quaternion skinning consumer.
 * @evidence contracts/common.md#clear-and-simple-design One two-quaternion carrier keeps rotation/translation representation together instead of duplicating a transform matrix beside the skinning blend.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The schema cannot enforce unit or dual-orthogonality constraints; the skinning producer must normalize valid rigid transforms before use.
 * @evidence contracts/common.md#meaningful-documentation The prose gives the dual-quaternion representation and members distinguish rotation from encoded translation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Dual-quaternion typing selects no hemisphere alignment or skinning blend algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Transform representation contains no repeated vertex-skinning result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two quaternion values retain no matrix buffers, vertex populations or running skinning task.
 * @author Samchon
 */
export interface IHumanBodyDualQuaternion {
  /** The rotation. */
  real: IAutoMovieQuaternion;

  /** Half the translation times the rotation, as a pure-quaternion product. */
  dual: IAutoMovieQuaternion;
}
