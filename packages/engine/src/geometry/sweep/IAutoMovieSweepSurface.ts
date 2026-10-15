import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweep } from "./IAutoMovieSweep";
import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import { IAutoMovieSweepPath } from "./IAutoMovieSweepPath";

/**
 * A sweep compiled for evaluation, from `compileAutoMovieSweep`.
 *
 * `u` is the chord-length parameter along the spine and `v` the turn around
 * it, both from 0 to 1; `u` outside its range is clamped and `v` wraps. The
 * surface is continuous in both. Every query is deterministic.
 *
 * @evidence contracts/common.md#principled-implementation The queries a sampler, a bridge and a measurement need from a parametric surface: position, radius, section frame, outward normal and the derivative along the spine.
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

  /**
   * Distance of the surface from the spine point in the section plane.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres, positive
   */
  radius(u: number, v: number): number;

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
   * @returns Metres
   */
  point(u: number, v: number): IAutoMovieVector3;

  /**
   * Unit normal pointing away from the spine, from central differences of the surface.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Unit vector
   */
  normal(u: number, v: number): IAutoMovieVector3;

  /**
   * Derivative of the surface point along the spine, by central difference.
   *
   * @param u Along the spine
   * @param v Around it
   * @returns Metres per unit of `u`
   */
  along(u: number, v: number): IAutoMovieVector3;
}
