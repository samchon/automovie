import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";

/**
 * A spine compiled for evaluation: its curve, unit tangent and
 * rotation-minimizing frame at any parameter, from `frameAutoMovieSweepSpine`.
 *
 * The parameter `u` runs over `[0, 1]` by chord length; values outside are
 * clamped to the ends.
 *
 * @evidence contracts/common.md#principled-implementation The three queries a sweep needs from its path, position, tangent and transported frame, behind one compiled record so the transport is computed once.
 * @evidence contracts/common.md#clear-and-simple-design A record of closures over the compiled path, owned by the sweep that compiled it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Queries outside the path clamp to its ends rather than extrapolating a curve the spine never declared.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the parameter's meaning and range, and each query's unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are answered on `frameAutoMovieSweepSpine`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record whose closures retain the transport table its producer states.
 * @author Samchon
 */
export interface IAutoMovieSweepPath {
  /** Length of the spine's point polygon in metres, the chord-length scale of `u`. */
  length: number;

  /**
   * Position on the curve.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @returns Metres
   */
  point(u: number): IAutoMovieVector3;

  /**
   * Unit tangent, the direction of increasing `u`.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @returns Unit vector
   */
  tangent(u: number): IAutoMovieVector3;

  /**
   * Rotation-minimizing frame: the normal is the tangent and `x` is the spine's starting direction transported without twist.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @returns The frame at the curve point
   */
  frame(u: number): IAutoMovieSweepFrame;
}
