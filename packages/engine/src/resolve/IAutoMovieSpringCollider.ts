/**
 * A collision sphere attached to a scene node, for in-frame spring stepping:
 * the sphere rides the node's composed world position each frame.
 *
 * @author Samchon
 */
export interface IAutoMovieSpringCollider {
  /** Node whose world position centers the sphere. */
  node: string;
  /** Sphere radius, meters. Strictly positive. */
  radius: number;
}
