import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieConstructionParallelOrigin } from "./IAutoMovieConstructionParallelOrigin";

/**
 * Parallel section planes with a moving source origin and fixed orthonormal
 * chart directions.
 *
 * Station is the authored parameter of the three origin curves, in metres, not
 * necessarily the origin course's arclength. The planes keep their specified
 * directions even when the origin drifts within them. For example, a lip can
 * advance in world Z with u=world Y and v=world X while its polar centre
 * follows the middle of its upper and contact outlines in Y. A tangent-normal
 * curved axis would change those authored planes.
 */
export interface IAutoMovieConstructionParallelAxis {
  /** Discriminator. */
  type: "parallel";

  /** Three world-coordinate source curves of the plane origin, metres. */
  origin: IAutoMovieConstructionParallelOrigin;

  /** Fixed first chart direction, unit length. */
  u: IAutoMovieVector3;

  /** Fixed second chart direction, unit length and perpendicular to u. */
  v: IAutoMovieVector3;
}
