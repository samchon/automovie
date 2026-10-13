import { IAutoMovieClip, IAutoMovieNode } from "@automovie/interface";

/**
 * A humanoid motion lowered onto the general node/clip model: the skeleton as a
 * bone-node hierarchy plus the clip whose tracks reproduce the motion on it.
 *
 * @author Samchon
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
