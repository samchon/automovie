import type { IAutoMovieVector3 } from "../IAutoMovieVector3";
import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";

/**
 * A spine compiled for evaluation: its curve, unit tangent and
 * rotation-minimizing frame at any parameter, from `frameAutoMovieSweepSpine`.
 *
 * The parameter `u` runs over `[0, 1]` by chord length; values outside are
 * clamped to the ends.
 *
 * @evidence contracts/development/design.md#principled-representation The three queries a sweep needs from its path, position, tangent and transported frame, behind one compiled record so the transport is computed once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A record of closures over the compiled path, owned by the sweep that compiled it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Queries outside the path clamp to its ends rather than extrapolating a curve the spine never declared.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the parameter's meaning and range, and each query's unit.
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
