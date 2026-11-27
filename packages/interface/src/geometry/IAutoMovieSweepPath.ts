import type { IAutoMovieVector3 } from "./IAutoMovieVector3";
import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";

/**
 * A spine compiled for evaluation: its curve, unit tangent and
 * rotation-minimizing frame at any parameter, from `frameAutoMovieSweepSpine`.
 *
 * The parameter `u` runs over `[0, 1]` by chord length; values outside are
 * clamped to the ends.
 */
export interface IAutoMovieSweepPath {
  /**
   * Length of the spine's point polygon in metres, the chord-length scale of
   * `u`.
   */
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
   * Rotation-minimizing frame: the normal is the tangent and `x` is the spine's
   * starting direction transported without twist.
   *
   * @param u Chord-length parameter, clamped to `[0, 1]`
   * @returns The frame at the curve point
   */
  frame(u: number): IAutoMovieSweepFrame;
}
