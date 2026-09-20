import { IAutoMovieClip, IAutoMovieNode } from "@automovie/interface";

/**
 * A humanoid motion lowered onto the general node/clip model: the skeleton as a
 * bone-node hierarchy plus the clip whose tracks reproduce the motion on it.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Preserves sampled humanoid motion as typed node tracks with the matching interpolation basis.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Couples the baked clip to the node hierarchy its channels address.
 * @author Samchon
 */
export interface IAutoMovieMotionClipBridge {
  /**
   * The baked clip: rotation tracks per articulated bone (+ root TRS).
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Stores each clinical-angle sample as its corresponding typed transform track.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Provides the densely sampled track data evaluated by the general clip model.
   */
  clip: IAutoMovieClip;

  /**
   * The skeleton lowered to nodes: one `bone` node per {@link IAutoMovieBone}
   * (id = bone name, parent = parent bone or the synthetic root), under a
   * `group` root node ({@link MOTION_ROOT_NODE_ID}) that carries the motion's
   * root transform.
   *
   * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-sparse-channel-default Supplies the rest hierarchy on which omitted transform channels retain their declared state.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Defines the concrete channel targets paired with the baked samples.
   */
  nodes: IAutoMovieNode[];
}
