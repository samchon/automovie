/**
 * A channel addressing a node's transform component or morph weights, following glTF core.
 *
 * translation and scale hold three values, rotation holds x/y/z/w and weights uses the unchecked model morph-target width. Interior linear rotation samples use slerp under a unit-input premise; cubic samples normalize, while endpoint samples copy authored values without normalization. resolveFrame uses node:<node>:<path> keys, folds sampled TRS components into local transforms and refuses missing node targets.
 *
 * Inside a profile's limits and drivers, node is a semantic key that bindProfile maps through an own boneMap entry and the placement prefix.
 *
 * @evidence contracts/common.md#principled-implementation channelKey refuses unknown node paths and builds a namespace disjoint from pointer keys; channelValueWidth supplies translation/rotation/scale widths of 3/4/3. channelIsRotation selects quaternion interpolation, but track shape admission does not check unit authored values or separately gate interpolated numeric results.
 * @evidence contracts/common.md#clear-and-simple-design The address is the node id plus a closed path union, so the value shape follows from the path and needs no separate value-type field, unlike the pointer arm that names an arbitrary property.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unknown morph-target count of a `weights` channel is stated as unchecked instead of guessed, and a channel naming a node absent from the frame throws rather than being skipped.
 * @evidence contracts/common.md#meaningful-documentation States the width and value order of every path, the slerp and renormalization of rotations, the key format, the missing-node failure, and when `node` is a semantic key mapped by a profile binding.
 */
export interface IAutoMovieNodeChannel {
  /** Selects the node arm of `IAutoMovieChannel`. */
  kind: "node";

  /**
   * Id of the targeted node; a semantic key when the channel sits in a profile's limits or drivers.
   */
  node: string;

  /**
   * Which animatable property of the node: one TRS component, or weights for variable-width morph target weights.
   */
  path: "translation" | "rotation" | "scale" | "weights";
}
