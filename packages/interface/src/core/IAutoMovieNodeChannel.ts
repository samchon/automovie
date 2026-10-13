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
