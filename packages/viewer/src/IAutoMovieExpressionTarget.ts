/**
 * Expression sink supplied by imported runtimes such as VRM managers.
 *
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Accepts only the resolved expression channels owned by the sampled frame.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-gaze-expression-attention Implements the runtime expression sink for those resolved channels.
 * @author Samchon
 */
export interface IAutoMovieExpressionTarget {
  /**
   * Set one normalized expression channel or preset to a weight in `[0, 1]`.
   *
   * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Accepts one resolved expression channel and its normalized weight.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-kinematics-gaze-expression-attention Applies that channel at the runtime expression boundary.
   */
  setExpressionValue: (name: string, weight: number) => void;
}
