import type { IAutoMovieHalfSpacePlane } from "../architecture/IAutoMovieHalfSpacePlane";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Data and callback contracts shared by the SolidBlockQuery operations. */
export namespace IAutoMovieSolidBlockQuery {
  /**
   * Whether a ray from `origin` along a unit `direction` is stopped by one
   * convex solid before `maxDistance`.
   *
   * The slab test over half-spaces, done analytically rather than by marching:
   * every plane either raises the entry parameter or lowers the exit one, and
   * the solid is hit exactly when an interval survives with a positive exit. A
   * ray that starts inside the solid is blocked at once, which is the right
   * answer for a sample point buried in a mass.
   *
   * Normals need not be normalized: the numerator and the denominator scale
   * together, so the parameter is unaffected by how long an authored normal is,
   * and the parallel test compares the slope against the normal's own length,
   * so it is too. A point is inside a plane when `dot(normal, point) <=
   * offset`. A ray leaving from a point exactly on a face is not blocked,
   * because a hit needs a positive exit. A ray whose slope against a plane is
   * `1e-12` or less is treated as never crossing it: starting outside that
   * plane means a miss, and starting inside leaves the other planes to decide.
   */
  export type IProps = {
    /** World-space ray origin in metres. */
    origin: IAutoMovieVector3;

    /** Unit ray direction. */
    direction: IAutoMovieVector3;

    /** Half-spaces whose intersection is the solid. */
    planes: readonly IAutoMovieHalfSpacePlane[];

    /** Furthest parameter that counts as a hit; `Infinity` for a sky ray. */
    maxDistance: number;
  };
}
