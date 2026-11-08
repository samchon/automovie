/**
 * An absolute rig transform in the parent frame, without scale. It can be
 * supplied directly by a deterministic rig evaluator to the Viewer adapter.
 *
 * @evidence contracts/development/design.md#principled-representation Uses metric translation and an x-y-z-w unit quaternion, the same translation/rotation rig convention as the engine; it carries no semantic joint angles or scaling.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One structural value describes both a bone local and a model root, without depending on a particular rig generator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No model, consumer or anatomical identity selects the representation.
 * @evidence contracts/development/common.md#meaningful-documentation States absolute parent-relative coordinates, units, quaternion order and the absence of scale.
 */
export interface IAutoMovieRigLocalTransform {
  /** Translation in metres, expressed in the parent frame. */
  readonly translation: readonly [number, number, number];

  /** Unit quaternion in x-y-z-w order, expressed in the parent frame. */
  readonly rotation: readonly [number, number, number, number];
}
