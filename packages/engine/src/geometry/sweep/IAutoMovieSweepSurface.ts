import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/**
 * A sweep compiled for evaluation, from `compileAutoMovieSweep`.
 *
 * `u` is the chord-length parameter along the spine and `v` the turn around
 * it, both from 0 to 1; `u` outside its range is clamped and `v` wraps. Every query is deterministic. Angular linear reconstruction and a local
 * feature nearest-branch change limit the smoothness guarantees.
 *
 * @evidence contracts/common.md#principled-implementation The queries a sampler, a bridge and a measurement need from a parametric surface: position, radius and its split into shape and scale, section frame, outward normal and the derivative along the spine.
 * @evidence contracts/common.md#clear-and-simple-design One record of closures over the compiled tables, so callers never repeat the compile.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-range `u` clamps to the ends instead of extrapolating sections no station declared.
 * @evidence contracts/common.md#meaningful-documentation States the producer, parameter ranges, clamping and wrapping, and each query's unit and direction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are answered on `compileAutoMovieSweep`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose closures retain what their producer states.
 * @author Samchon
 */
export interface IAutoMovieSweepSurface {
  /** The sweep this surface was compiled from, unchanged. */
  sweep: IAutoMovieSweep;

  /** The compiled spine. */
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
   * @evidence contracts/common.md#principled-implementation Reads the exact domain spline the compiled displacement field uses.
   * @evidence contracts/common.md#clear-and-simple-design One query without another feature compile.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The input polyline is never substituted for the smooth course.
   * @evidence contracts/common.md#meaningful-documentation Gives the index, knot parameter, units and refusal.
   * @evidence contracts/performance.md#efficient-algorithms Two O(log n) segment searches and cubic evaluations for n feature points; returns one domain record.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The surface retains the shared feature coefficients.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; the compiled surface owns the coefficients.
   */
  feature(index: number, t: number): { u: number; v: number };

  /**
   * Point in the section plane before scale, the shape a compiled rig caches.
   *
   * @param u Along the spine, clamped to 0 to 1
   * @param v Round the loop, wrapping as the selected correspondence defines
   * @param loop Outer loop 0 or a hole index; omitted, 0
   * @returns Unscaled section-plane coordinates in metres; parameter correspondence may pass through its origin
   * @throws Error for an unknown loop or a non-finite generated shape
   *
   * @evidence contracts/common.md#principled-implementation Reads the same unscaled section operator used by section, avoiding a scale followed by a lossy division in rig compilation.
   * @evidence contracts/common.md#clear-and-simple-design One source for a full section-plane point before scaling, including non-radial parameter correspondence.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no reconstructed point, clamp on shape values or consumer-specific coordinate.
   * @evidence contracts/common.md#meaningful-documentation States scale ordering, frame, units, loop numbering and valid authored zero.
   * @evidence contracts/performance.md#efficient-algorithms Uses the existing cached-row and feature evaluator, or the parameter-correspondence coordinate profiles; returns one point record.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; the compiled surface owns the cached shape data.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature returning a caller-owned point.
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
   * @evidence contracts/common.md#principled-implementation The section point before the plane is placed, scaled by the profile.
   * @evidence contracts/common.md#clear-and-simple-design One query per loop point.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A loop the sweep lacks is refused.
   * @evidence contracts/common.md#meaningful-documentation States the loop numbering and unit.
   * @evidence contracts/performance.md#efficient-algorithms A cached-row read plus the features whose band reaches `u`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  section(u: number, v: number, loop?: number): IAutoMovieSweepSection.IPoint;

  /**
   * Distance of the section's outer loop from the spine point in the section plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive for direction correspondence; parameter correspondence permits zero at an authored origin point
   *
   * @evidence contracts/common.md#principled-implementation The outer loop's radius, the scale times the shape.
   * @evidence contracts/common.md#clear-and-simple-design One query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Values outside the domain clamp or wrap as the surface states.
   * @evidence contracts/common.md#meaningful-documentation States the unit.
   * @evidence contracts/performance.md#efficient-algorithms A cached-row read plus the features whose band reaches `u`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  radius(u: number, v: number): number;

  /**
   * Distance of the section's outer loop from the spine point before the scale profile, so `radius` is `scale(u) * profile(u, v)`.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive for direction correspondence; parameter correspondence permits zero at an authored origin point
   *
   * @evidence contracts/common.md#principled-implementation The radius before the scale profile, the pose-invariant shape posing reuses.
   * @evidence contracts/common.md#clear-and-simple-design One query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No scale is folded in.
   * @evidence contracts/common.md#meaningful-documentation States the relation to `radius`.
   * @evidence contracts/performance.md#efficient-algorithms A cached-row read plus the features whose band reaches `u`.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  profile(u: number, v: number): number;

  /**
   * Factor of the scale profile, 1 where the sweep gives none.
   *
   * @param u Along the spine
   * @returns A positive factor
   *
   * @evidence contracts/common.md#principled-implementation The scale profile's monotone interpolant.
   * @evidence contracts/common.md#clear-and-simple-design One query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A sweep without a profile reads 1.
   * @evidence contracts/common.md#meaningful-documentation States the default.
   * @evidence contracts/performance.md#efficient-algorithms A binary search and a cubic.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  scale(u: number): number;

  /**
   * Section plane at a spine parameter, with the stations' rotations applied.
   *
   * @param u Along the spine
   * @returns The frame
   *
   * @evidence contracts/common.md#principled-implementation The carried frame turned by the interpolated station rotations.
   * @evidence contracts/common.md#clear-and-simple-design One query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Parameters clamp to the spine.
   * @evidence contracts/common.md#meaningful-documentation States what the frame includes.
   * @evidence contracts/performance.md#efficient-algorithms One transport frame and one orientation step.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
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
   * @evidence contracts/common.md#principled-implementation The section point placed in its frame.
   * @evidence contracts/common.md#clear-and-simple-design One query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No smoothing is applied.
   * @evidence contracts/common.md#meaningful-documentation States the unit.
   * @evidence contracts/performance.md#efficient-algorithms A frame and a section query.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  point(u: number, v: number, loop?: number): IAutoMovieVector3;

  /**
   * Unit normal `dP/dv x dP/du` from central differences of the surface, which points away from the spine where the loop runs counterclockwise in its plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Unit vector
   *
   * @evidence contracts/common.md#principled-implementation The unit normal from central differences of the surface.
   * @evidence contracts/common.md#clear-and-simple-design One query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The step is the stated `step`, the same one posed rigs use.
   * @evidence contracts/common.md#meaningful-documentation States the orientation of the normal.
   * @evidence contracts/performance.md#efficient-algorithms Four point queries.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  normal(u: number, v: number, loop?: number): IAutoMovieVector3;

  /**
   * Derivative of the surface point along the spine, by central difference.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Metres per unit of `u`
   *
   * @evidence contracts/common.md#principled-implementation The derivative along the spine by central difference.
   * @evidence contracts/common.md#clear-and-simple-design One query.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The difference clamps at the spine's ends.
   * @evidence contracts/common.md#meaningful-documentation States the unit.
   * @evidence contracts/performance.md#efficient-algorithms Two point queries.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `compileAutoMovieSweep`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `compileAutoMovieSweep`.
   */
  along(u: number, v: number, loop?: number): IAutoMovieVector3;
}
