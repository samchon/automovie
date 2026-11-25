/**
 * A channel addressing a node's transform component or morph weights, following
 * glTF core.
 *
 * Translation and scale hold three values, rotation holds x/y/z/w and weights
 * uses the unchecked model morph-target width. Interior linear rotation samples
 * use slerp under a unit-input premise; cubic samples normalize, while endpoint
 * samples copy authored values without normalization. resolveFrame uses
 * node:<node>:<path> keys, folds sampled TRS components into local transforms
 * and refuses missing node targets.
 *
 * Inside a profile's limits and drivers, node is a semantic key that
 * bindProfile maps through an own boneMap entry and the placement prefix.
 */
export interface IAutoMovieNodeChannel {
  /** Selects the node arm of `IAutoMovieChannel`. */
  kind: "node";

  /**
   * Id of the targeted node; a semantic key when the channel sits in a
   * profile's limits or drivers.
   */
  node: string;

  /**
   * Which animatable property of the node: one TRS component, or weights for
   * variable-width morph target weights.
   */
  path: "translation" | "rotation" | "scale" | "weights";
}
