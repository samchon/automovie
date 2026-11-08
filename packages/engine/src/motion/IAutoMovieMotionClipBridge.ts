import { IAutoMovieClip, IAutoMovieNode } from "@automovie/interface";

/**
 * A humanoid motion lowered onto the general node/clip model: the skeleton as a
 * bone-node hierarchy plus the clip whose tracks reproduce the motion on it.
 * motionToClip emits full rest-plus-articulation local rotation tracks and
 * root translation/rotation tracks; expressions are omitted. Agreement with
 * clinical-angle sampling is exact at bake times, with interpolation between.
 *
 * @evidence contracts/development/design.md#principled-representation Couples the skeleton's lowered node hierarchy with channels targeting those same prefixed ids, carrying full local bone rotations because general clip overrides replace node rotation rather than add articulation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Nodes and clip travel together so sceneToNodes can instantiate one actor subtree and apply the matching sampled channels without a renderer-specific humanoid model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Lowered bone scales follow resolvePose's unit-scale convention, and unsupported expression channels are documented as absent rather than fabricated morph weights.
 * @evidence contracts/development/common.md#meaningful-documentation States complete local rotations, root tracks, omitted expressions, bake-time parity and the target-node hierarchy relationship.
 */
export interface IAutoMovieMotionClipBridge {
  /** The baked clip: rotation tracks per articulated bone (+ root TRS). */
  clip: IAutoMovieClip;

  /**
   * The skeleton lowered to nodes: one `bone` node per {@link IAutoMovieBone}
   * (id = bone name, parent = parent bone or the synthetic root), under a
   * `group` root node ({@link MOTION_ROOT_NODE_ID}) that carries the motion's
   * root transform.
   */
  nodes: IAutoMovieNode[];
}
