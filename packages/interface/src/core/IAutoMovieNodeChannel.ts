/**
 * A channel addressing a node's transform component or morph weights (glTF
 * core).
 *
 * Each path fixes its width: `translation` and `scale` hold 3 values,
 * `rotation` holds an `x, y, z, w` quaternion that linear tracks slerp and
 * cubic tracks renormalize, and `weights` is as wide as the node's morph
 * targets, which the track validator cannot check. `resolveFrame` keys the
 * channel as `node:<node>:<path>`, folds a sampled TRS path into that node's
 * transform for the frame, and throws when the named node is not in its list.
 *
 * Inside a profile's `limits` and `drivers`, `node` is a semantic key that
 * `bindProfile` maps through the binding's `boneMap` and placement prefix.
 *
 * @evidence contracts/common.md#principled-implementation `channelKey` refuses a path outside the four node paths and builds a `node:` key disjoint from pointer keys; `channelValueWidth` fixes 3, 4 and 3 values for translation, rotation and scale, and `channelIsRotation` routes the rotation path through slerp so interpolated quaternions stay on the unit sphere.
 * @evidence contracts/common.md#clear-and-simple-design The address is the node id plus a closed path union, so the value shape follows from the path and needs no separate value-type field, unlike the pointer arm that names an arbitrary property.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The unknown morph-target count of a `weights` channel is stated as unchecked instead of guessed, and a channel naming a node absent from the frame throws rather than being skipped.
 * @evidence contracts/common.md#meaningful-documentation States the width and value order of every path, the slerp and renormalization of rotations, the key format, the missing-node failure, and when `node` is a semantic key mapped by a profile binding.
 * @author Samchon
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
   * Which animatable property of the node: one TRS component, or `weights` for
   * the variable-width morph target weights.
   */
  path: "translation" | "rotation" | "scale" | "weights";
}
