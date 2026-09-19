/**
 * A channel addressing a node's transform component or morph weights (glTF
 * core).
 *
 * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `IAutoMovieNodeChannel` as the portable data boundary for the motion channel contract requirement.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `IAutoMovieNodeChannel` for the performance motion clip keytime interpolation system contract.
 */
export interface IAutoMovieNodeChannel {
  /**
   * Discriminator.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `kind` as the portable data boundary for the motion channel contract requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `kind` for the performance motion clip keytime interpolation system contract.
   */
  kind: "node";

  /**
   * Id of the targeted node.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `node` as the portable data boundary for the motion channel contract requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `node` for the performance motion clip keytime interpolation system contract.
   */
  node: string;

  /**
   * Which animatable property of the node. `weights` targets the node's morph
   * target weights (a variable-width vector); the others are the TRS
   * components.
   *
   * @evidence requirements/motion/channels-controls-and-drivers.md#motion-channel-contract Exposes `path` as the portable data boundary for the motion channel contract requirement.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Types `path` for the performance motion clip keytime interpolation system contract.
   */
  path: "translation" | "rotation" | "scale" | "weights";
}
