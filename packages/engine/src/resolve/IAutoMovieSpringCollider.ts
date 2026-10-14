/**
 * A collision sphere attached to a scene node, for in-frame spring stepping:
 * the sphere rides the node's composed world position each frame.
 *
 *
 * @evidence contracts/common.md#principled-implementation Describe a positive-radius collision sphere whose centre follows a named node's composed world position; the world pass resolves that position before spring stepping.
 * @evidence contracts/common.md#clear-and-simple-design An id/radius row separates node attachment from the world-space sphere consumed by stepSpring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing node is replaced by the origin and no invalid radius becomes a default; owning world-driver guards refuse them.
 * @evidence contracts/common.md#meaningful-documentation Members document attached node identity and strictly positive metre radius, independent of any rendered collider mesh.
 * @evidence contracts/performance.md#efficient-algorithms Each collider is a fixed scalar/string row; resolving C attachments and testing J joints against them costs work in the world pass/spring owner.
 * @evidence contracts/performance.md#reuse-equivalent-work All springs in the frame share the completed world-space collider population; changed world transforms require new centre resolution.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input caller owns collider descriptors, with no collision handle, mesh, worker or task retained by this type.
 * @author Samchon
 */
export interface IAutoMovieSpringCollider {
  /** Node whose world position centers the sphere. */
  node: string;

  /** Sphere radius, meters. Strictly positive. */
  radius: number;
}
