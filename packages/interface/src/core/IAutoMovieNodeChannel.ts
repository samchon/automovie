/**
 * A channel addressing a node's transform component or morph weights (glTF
 * core).
 */
export interface IAutoMovieNodeChannel {
  /** Discriminator. */
  kind: "node";

  /** Id of the targeted node. */
  node: string;

  /**
   * Which animatable property of the node. `weights` targets the node's morph
   * target weights (a variable-width vector); the others are the TRS
   * components.
   */
  path: "translation" | "rotation" | "scale" | "weights";
}
