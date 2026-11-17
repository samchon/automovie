/**
 * A collision sphere attached to a scene node, for in-frame spring stepping:
 * the sphere rides the node's composed world position each frame.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Describe a positive-radius collision sphere whose centre follows a named node's composed world position; the world pass resolves that position before spring stepping.
 * @evidence contracts/development/design.md#minimal-and-owned-surface An id/radius row separates node attachment from the world-space sphere consumed by stepSpring.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No missing node is replaced by the origin and no invalid radius becomes a default; owning world-driver guards refuse them.
 * @evidence contracts/development/common.md#meaningful-documentation Members document attached node identity and strictly positive metre radius, independent of any rendered collider mesh.
 */
export interface IAutoMovieSpringCollider {
  /** Node whose world position centers the sphere. */
  node: string;

  /** Sphere radius, meters. Strictly positive. */
  radius: number;
}
