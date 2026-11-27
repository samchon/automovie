import type { IAutoMovieVector3 } from "./IAutoMovieVector3";
import type { IAutoMovieSweep } from "./IAutoMovieSweep";
import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import type { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/**
 * A sweep compiled for evaluation, from `compileAutoMovieSweep`.
 *
 * `u` is the chord-length parameter along the spine and `v` the turn around it,
 * both from 0 to 1. Under direction correspondence v is polar angle divided by
 * 2*pi; under parameter correspondence it is the section curve parameter and
 * need not be polar angle or arc-length share. Position, section and frame
 * queries clamp u and wrap v. Differential queries require u in [0,1]; their
 * endpoint stencil is one-sided. Every query is deterministic. Angular linear
 * reconstruction and a local feature nearest-branch change limit the smoothness
 * guarantees. Coordinates use the authored model frame and metres. Returned
 * points and frames are fresh mutable records. The compiled surface retains its
 * source declaration and coefficients; preserve authored data while using it.
 * compileAutoMovieSweep admits authored geometry, while individual queries
 * refuse invalid generated radii or section coordinates; finite query arguments
 * remain the caller's responsibility.
 */
export interface IAutoMovieSweepSurface {
  /**
   * Borrowed source declaration by identity, not a deep snapshot. Changing it
   * after compilation can disagree with retained coefficients.
   */
  sweep: IAutoMovieSweep;

  /**
   * Compiled spine in the same model frame, with polygonal chord length in
   * metres and normalized chord-length parameterization.
   */
  path: IAutoMovieSweepPath;

  /**
   * Parameter step of the central differences `normal` and `along` take, in `u`
   * and in `v`.
   */
  step: number;

  /**
   * Number of loops: 1 for a sweep by direction, 1 plus its holes for a sweep
   * by parameter.
   */
  loops: number;

  /**
   * The defining course of a feature in the sweep's domain.
   *
   * @param index Feature index in the sweep's declaration
   * @param t Clamped share of the complete centripetal knot span, 0 to 1
   * @returns U along the spine and v in unwrapped turns
   * @throws Error when the feature index does not exist
   */
  feature(
    index: number,
    t: number,
  ): {
    /**
     * Spine-domain coordinate on the fitted feature course; the cubic can
     * overshoot authored u knots.
     */
    u: number;

    /**
     * Unwrapped fitted angular coordinate in turns, preserving continuity
     * through the seam.
     */
    v: number;
  };

  /**
   * Point in the section plane before scale, the shape a compiled rig caches.
   *
   * @param u Along the spine, clamped to 0 to 1
   * @param v Round the loop, wrapping as the selected correspondence defines
   * @param loop Outer loop 0 or a hole index; omitted, 0
   * @returns Unscaled section-plane coordinates in metres; parameter
   *   correspondence may pass through its origin
   * @throws Error for an unknown loop or a non-finite generated shape
   */
  shape(u: number, v: number, loop?: number): IAutoMovieSweepSection.IPoint;

  /**
   * Point of a loop in the section plane at a spine parameter, before the plane
   * is placed.
   *
   * @param u Along the spine
   * @param v Round the loop
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Metres along the plane's first and second axes
   * @throws Error for a non-finite scaled result or a nonzero section point
   *   lost to arithmetic underflow
   */
  section(u: number, v: number, loop?: number): IAutoMovieSweepSection.IPoint;

  /**
   * Distance of the section's outer loop from the spine point in the section
   * plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive for direction correspondence; parameter
   *   correspondence permits zero at an authored origin point
   */
  radius(u: number, v: number): number;

  /**
   * Distance of the section's outer loop from the spine point before the scale
   * profile, so `radius` is `scale(u) * profile(u, v)`.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive for direction correspondence; parameter
   *   correspondence permits zero at an authored origin point
   */
  profile(u: number, v: number): number;

  /**
   * Factor of the scale profile, 1 where the sweep gives none.
   *
   * @param u Along the spine
   * @returns A positive factor
   */
  scale(u: number): number;

  /**
   * Section plane at a spine parameter, with the stations' rotations applied.
   *
   * @param u Along the spine
   * @returns The frame
   */
  frame(u: number): IAutoMovieSweepFrame;

  /**
   * Surface point.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Metres
   */
  point(u: number, v: number, loop?: number): IAutoMovieVector3;

  /**
   * Unit normal `dP/dv x dP/du` from central differences of the surface, which
   * points away from the spine where the loop runs counterclockwise in its
   * plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Dimensionless model-space unit vector, or zero when the
   *   finite-difference cross product is zero; hole orientation follows its
   *   authored winding
   */
  normal(u: number, v: number, loop?: number): IAutoMovieVector3;

  /**
   * Derivative of the surface point along the spine, by central difference.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Model-space metres per normalized u, not a unit tangent; endpoint
   *   differences divide by their actual clipped span
   */
  along(u: number, v: number, loop?: number): IAutoMovieVector3;
}
