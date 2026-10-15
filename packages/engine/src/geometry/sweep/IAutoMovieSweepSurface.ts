import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";
import { IAutoMovieSweepSection } from "./IAutoMovieSweepSection";

/**
 * A sweep compiled for evaluation, from `compileAutoMovieSweep`.
 *
 * `u` is the chord-length parameter along the spine and `v` the turn around
 * it, both from 0 to 1; `u` outside its range is clamped and `v` wraps. The
 * surface is continuous in both. Every query is deterministic.
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

  /** Number of loops: 1 for a sweep by direction, 1 plus its holes for a sweep by parameter. */
  loops: number;

  /**
   * Point of a loop in the section plane at a spine parameter, before the plane is placed.
   *
   * @param u Along the spine
   * @param v Round the loop
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Metres along the plane's first and second axes
   */
  section(u: number, v: number, loop?: number): IAutoMovieSweepSection.IPoint;

  /**
   * Distance of the section's outer loop from the spine point in the section plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive
   */
  radius(u: number, v: number): number;

  /**
   * Distance of the section's outer loop from the spine point before the scale profile, so `radius` is `scale(u) * profile(u, v)`.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive
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
   * Unit normal `dP/dv x dP/du` from central differences of the surface, which points away from the spine where the loop runs counterclockwise in its plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Unit vector
   */
  normal(u: number, v: number, loop?: number): IAutoMovieVector3;

  /**
   * Derivative of the surface point along the spine, by central difference.
   *
   * @param u Along the spine
   * @param v Around it
   * @param loop 0 for the section, `k` for hole `k - 1`; omitted, 0
   * @returns Metres per unit of `u`
   */
  along(u: number, v: number, loop?: number): IAutoMovieVector3;
}
