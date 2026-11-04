/**
 * An absolute rig transform in the parent frame, without scale. It can be
 * supplied directly by a deterministic rig evaluator to the Viewer adapter.
 *
 * @evidence contracts/common.md#principled-implementation Uses metric translation and an x-y-z-w unit quaternion, the same translation/rotation rig convention as the engine; it carries no semantic joint angles or scaling.
 * @evidence contracts/common.md#clear-and-simple-design One structural value describes both a bone local and a model root, without depending on a particular rig generator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No model, consumer or anatomical identity selects the representation.
 * @evidence contracts/common.md#meaningful-documentation States absolute parent-relative coordinates, units, quaternion order and the absence of scale.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This data contract performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This data contract coordinates no cache or requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns tuple storage; the contract acquires no resources.
 */
export interface IAutoMovieRigLocalTransform {
  /** Translation in metres, expressed in the parent frame. */
  readonly translation: readonly [number, number, number];

  /** Unit quaternion in x-y-z-w order, expressed in the parent frame. */
  readonly rotation: readonly [number, number, number, number];
}
