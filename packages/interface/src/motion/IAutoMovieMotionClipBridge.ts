import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieNode } from "../core/IAutoMovieNode";

/**
 * A humanoid motion lowered onto the general node/clip model: the skeleton as a
 * bone-node hierarchy plus the clip whose tracks reproduce the motion on it.
 * motionToClip emits full rest-plus-articulation local rotation tracks and root
 * translation/rotation tracks; expressions are omitted. Agreement with
 * clinical-angle sampling is exact at bake times, with interpolation between.
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
