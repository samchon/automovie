import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * The plane one section of a sweep lies in: its origin on the spine and an
 * orthonormal right-handed basis.
 *
 * A section point at polar angle `a` and radius `r` sits at `origin + r (cos a
 * * x + sin a * y)`. `normal = x * y` is the plane's normal, which follows the
 * spine's tangent unless a station rotates the plane.
 */
export interface IAutoMovieSweepFrame {
  /** Spine point, metres. */
  origin: IAutoMovieVector3;

  /** Unit first axis of the section plane, angle 0. */
  x: IAutoMovieVector3;

  /** Unit second axis of the section plane, angle 90 degrees. */
  y: IAutoMovieVector3;

  /** Unit normal of the section plane, `x * y`. */
  normal: IAutoMovieVector3;
}
