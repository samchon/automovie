import type { IAutoMovieSweep } from "./IAutoMovieSweep";
import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import type { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import type { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";
import type { IAutoMovieVector3 } from "../IAutoMovieVector3";

/**
 * A sweep compiled for evaluation, from `compileAutoMovieSweep`.
 *
 * `u` is the chord-length parameter along the spine and `v` the turn around
 * it, both from 0 to 1. Under direction correspondence v is polar angle divided by 2*pi; under parameter correspondence it is the section curve parameter and need not be polar angle or arc-length share. Position, section and frame queries clamp u and wrap v. Differential queries require u in [0,1]; their endpoint stencil is one-sided. Every query is deterministic. Angular linear reconstruction and a local
 * feature nearest-branch change limit the smoothness guarantees. Coordinates use the authored model frame and metres. Returned points and frames are fresh mutable records. The compiled surface retains its source declaration and coefficients; preserve authored data while using it. compileAutoMovieSweep admits authored geometry, while individual queries refuse invalid generated radii or section coordinates; finite query arguments remain the caller's responsibility.
 *
 * @evidence contracts/development/design.md#principled-representation The queries a sampler, a bridge and a measurement need from a parametric surface: position, radius and its split into shape and scale, section frame, outward normal and the derivative along the spine.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record of closures over the compiled tables, so callers never repeat the compile.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Section and frame queries clamp u while differential queries require u in [0,1]; the common number signature does not enforce that premise or distinguish polar and curve-parameter v.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, parameter ranges, clamping and wrapping, and each query's unit and direction.
 */
export interface IAutoMovieSweepSurface {
  /** Borrowed source declaration by identity, not a deep snapshot. Changing it after compilation can disagree with retained coefficients. */
  sweep: IAutoMovieSweep;

  /** Compiled spine in the same model frame, with polygonal chord length in metres and normalized chord-length parameterization. */
  path: IAutoMovieSweepPath;

  /** Parameter step of the central differences `normal` and `along` take, in `u` and in `v`. */
  step: number;

  /** Number of loops: 1 for a sweep by direction, 1 plus its holes for a sweep by parameter. */
  loops: number;

  /**
   * The defining course of a feature in the sweep's domain.
   *
   * @param index Feature index in the sweep's declaration
   * @param t Clamped share of the complete centripetal knot span, 0 to 1
   * @returns u along the spine and v in unwrapped turns
   * @throws Error when the feature index does not exist
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the exact domain spline the compiled displacement field uses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One query without another feature compile.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The input polyline is never substituted for the smooth course.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the index, knot parameter, units and refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two O(log n) segment searches and cubic evaluations for n feature points; returns one domain record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The surface retains the shared feature coefficients.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; the compiled surface owns the coefficients.
   */
  feature(index: number, t: number): {
    /** Spine-domain coordinate on the fitted feature course; the cubic can overshoot authored u knots. */
    u: number;

    /** Unwrapped fitted angular coordinate in turns, preserving continuity through the seam. */
    v: number;
  };

  /**
   * Point in the section plane before scale, the shape a compiled rig caches.
   *
   * @param u Along the spine, clamped to 0 to 1
   * @param v Round the loop, wrapping as the selected correspondence defines
   * @param loop Outer loop 0 or a hole index; omitted, 0
   * @returns Unscaled section-plane coordinates in metres; parameter correspondence may pass through its origin
   * @throws Error for an unknown loop or a non-finite generated shape
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the same unscaled section operator used by section, avoiding a scale followed by a lossy division in rig compilation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One source for a full section-plane point before scaling, including non-radial parameter correspondence.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no reconstructed point, clamp on shape values or consumer-specific coordinate.
   * @evidence contracts/development/common.md#meaningful-documentation States scale ordering, frame, units, loop numbering and valid authored zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses the existing cached-row and feature evaluator, or the parameter-correspondence coordinate profiles; returns one point record.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; the compiled surface owns the cached shape data.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature returning a caller-owned point.
   */
  shape(u: number, v: number, loop?: number): IAutoMovieSweepSection.IPoint;

  /**
   * Point of a loop in the section plane at a spine parameter, before the plane is placed.
   *
   * @param u Along the spine
   * @param v Round the loop
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Metres along the plane's first and second axes
   * @throws Error for a non-finite scaled result or a nonzero section point lost to arithmetic underflow
   *
   * @evidence contracts/development/implementation.md#principled-implementation The section point before the plane is placed, scaled by the profile.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One query per loop point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A loop the sweep lacks is refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the loop numbering and unit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Direction correspondence reads a cached radial row and feature fields; parameter correspondence evaluates the two bracketing section samples' scalar profiles, followed by one scale query.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  section(u: number, v: number, loop?: number): IAutoMovieSweepSection.IPoint;

  /**
   * Distance of the section's outer loop from the spine point in the section plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive for direction correspondence; parameter correspondence permits zero at an authored origin point
   *
   * @evidence contracts/development/implementation.md#principled-implementation Multiplies the unscaled outer-loop norm by positive scale and refuses nonfinite or underflowed nonzero radii.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to the shared profile and scale queries so radial measurements agree with section evaluation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Values outside the domain clamp or wrap as the surface states.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidence contracts/development/implementation.md#efficient-algorithms One profile query and one scale query; profile cost follows the selected correspondence and active feature fields.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  radius(u: number, v: number): number;

  /**
   * Distance of the section's outer loop from the spine point before the scale profile, so `radius` is `scale(u) * profile(u, v)`.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive for direction correspondence; parameter correspondence permits zero at an authored origin point
   *
   * @evidence contracts/development/implementation.md#principled-implementation The radius before the scale profile, the pose-invariant shape posing reuses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direction correspondence returns the guided and featured radius; parameter correspondence takes the outer-loop shape point's norm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No scale is folded in.
   * @evidence contracts/development/common.md#meaningful-documentation States the relation to `radius`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses the cached directional row and feature searches, or two bracketing Cartesian profile samples for parameter correspondence.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  profile(u: number, v: number): number;

  /**
   * Factor of the scale profile, 1 where the sweep gives none.
   *
   * @param u Along the spine
   * @returns A positive factor
   *
   * @evidence contracts/development/implementation.md#principled-implementation compileAutoMovieSweepProfile evaluates the tension spline and rejects nonpositive or nonfinite query results; the interpolant is not monotonicity-preserving.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clamps the spine coordinate, then evaluates the admitted scalar profile or returns the absent-profile factor one.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A sweep without a profile reads 1.
   * @evidence contracts/development/common.md#meaningful-documentation States the default.
   * @evidence contracts/development/implementation.md#efficient-algorithms A binary search followed by the spline's cubic or tension evaluation; an absent scale returns one directly.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  scale(u: number): number;

  /**
   * Section plane at a spine parameter, with the stations' rotations applied.
   *
   * @param u Along the spine
   * @returns The frame
   *
   * @evidence contracts/development/implementation.md#principled-implementation The carried frame turned by the interpolated station rotations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the shared packed orientation evaluator and copies its origin and three axes into a fresh frame record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Parameters clamp to the spine.
   * @evidence contracts/development/common.md#meaningful-documentation States what the frame includes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One transport frame and one orientation step.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  frame(u: number): IAutoMovieSweepFrame;

  /**
   * Surface point.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Metres
   *
   * @evidence contracts/development/implementation.md#principled-implementation The section point placed in its frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Adds the section x/y coordinates along the frame axes to its origin.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No smoothing is applied.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidence contracts/development/implementation.md#efficient-algorithms A frame and a section query.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  point(u: number, v: number, loop?: number): IAutoMovieVector3;

  /**
   * Unit normal `dP/dv x dP/du` from central differences of the surface, which points away from the spine where the loop runs counterclockwise in its plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Dimensionless model-space unit vector, or zero when the finite-difference cross product is zero; hole orientation follows its authored winding
   *
   * @evidence contracts/development/implementation.md#principled-implementation The unit normal from central differences of the surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Crosses the wrapped-v finite difference with the axial difference and normalizes using Vector3.normalize.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The step is the stated `step`, the same one posed rigs use.
   * @evidence contracts/development/common.md#meaningful-documentation States the orientation of the normal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four point queries.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  normal(u: number, v: number, loop?: number): IAutoMovieVector3;

  /**
   * Derivative of the surface point along the spine, by central difference.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Model-space metres per normalized u, not a unit tangent; endpoint differences divide by their actual clipped span
   *
   * @evidence contracts/development/implementation.md#principled-implementation The derivative along the spine by central difference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Evaluates the two clipped u endpoints and divides their displacement by the actual parameter span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The difference clamps at the spine's ends.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two point queries.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  along(u: number, v: number, loop?: number): IAutoMovieVector3;
}
