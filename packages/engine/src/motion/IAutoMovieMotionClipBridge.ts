import { IAutoMovieClip, IAutoMovieNode } from "@automovie/interface";

/**
 * A humanoid motion lowered onto the general node/clip model: the skeleton as a
 * bone-node hierarchy plus the clip whose tracks reproduce the motion on it.
 * motionToClip emits full rest-plus-articulation local rotation tracks and
 * root translation/rotation tracks; expressions are omitted. Agreement with
 * clinical-angle sampling is exact at bake times, with interpolation between.
 *
 * @evidence contracts/common.md#principled-implementation Couples the skeleton's lowered node hierarchy with channels targeting those same prefixed ids, carrying full local bone rotations because general clip overrides replace node rotation rather than add articulation.
 * @evidence contracts/common.md#clear-and-simple-design Nodes and clip travel together so sceneToNodes can instantiate one actor subtree and apply the matching sampled channels without a renderer-specific humanoid model.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Lowered bone scales follow resolvePose's unit-scale convention, and unsupported expression channels are documented as absent rather than fabricated morph weights.
 * @evidence contracts/common.md#meaningful-documentation States complete local rotations, root tracks, omitted expressions, bake-time parity and the target-node hierarchy relationship.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This bridge record performs no bake; motionToClip chooses the clock and builds track values.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The hierarchy and clip share node-address semantics but the result type defines no cross-actor or cross-bake cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns node and track arrays sized by skeleton and sample counts; the bridge retains no GPU object or playback task.
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
