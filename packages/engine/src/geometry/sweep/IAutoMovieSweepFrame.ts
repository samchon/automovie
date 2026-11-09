import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The plane one section of a sweep lies in: its origin on the spine and an
 * orthonormal right-handed basis.
 *
 * A section point at polar angle `a` and radius `r` sits at
 * `origin + r (cos a * x + sin a * y)`. `normal = x * y` is the plane's normal,
 * which follows the spine's tangent unless a station rotates the plane.
 *
 * @evidence contracts/development/design.md#principled-representation An origin and three orthonormal axes are the least that place a planar section in space with a known handedness.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record for what the spine transport and the compiled sweep return.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The frame carries no scale; radii stay in the section.
 * @evidence contracts/development/common.md#meaningful-documentation States how a section point is placed and the handedness.
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
