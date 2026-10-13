/**
 * A channel addressing a node's transform component or morph weights (glTF
 * core).
 *
 * Each path fixes its width: `translation` and `scale` hold 3 values,
 * `rotation` holds an `x, y, z, w` quaternion that linear tracks interpolate by
 * slerp, and `weights` is as wide as the node's morph targets, which the track
 * validator cannot check. Inside a profile, `node` is a semantic key that
 * `bindProfile` maps through the binding's `boneMap` and placement prefix.
 *
 * @evidence contracts/common.md#principled-implementation Uses the glTF animation-target paths, keyed by `channelKey` as `node:<id>:<path>`; `channelIsRotation` selects slerp for the `rotation` path because component-wise lerp moves a quaternion off the unit sphere.
 * @evidence contracts/common.md#clear-and-simple-design A node id and a closed path enum suffice because each path's width and interpolation follow from the path itself, so this arm needs no value type field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unknown path throws in `channelKey` rather than being keyed anyway, and the `weights` width is left unchecked by design since only the model knows its morph count.
 * @evidence contracts/common.md#meaningful-documentation Gives the width and component order per path, the slerp rule for rotation, the unchecked weights width, and the semantic-key meaning of `node` inside a profile.
 * @author Samchon
 */
export interface IAutoMovieNodeChannel {
  /** Discriminator. */
  kind: "node";

  /**
   * Id of the targeted node; a semantic key when the channel is in a profile.
   */
  node: string;

  /**
   * Which animatable property of the node. `weights` targets the node's morph
   * target weights (a variable-width vector); the others are the TRS
   * components.
   */
  path: "translation" | "rotation" | "scale" | "weights";
}
