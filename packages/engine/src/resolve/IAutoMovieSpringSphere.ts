import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A world-space collision sphere the spring chain keeps out of: a head, a
 * torso, a shoulder pad. A chain joint is pushed to the sphere's surface plus
 * the driver's own `hitRadius` (the joint's physical thickness), completing the
 * VRM SpringBone collision semantics that `hitRadius` always declared.
 *
 * @author Samchon
 */
export interface IAutoMovieSpringSphere {
  /** Sphere center in world space. */
  center: IAutoMovieVector3;
  /** Sphere radius, meters. Strictly positive. */
  radius: number;
}
