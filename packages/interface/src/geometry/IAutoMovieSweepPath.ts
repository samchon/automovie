import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import type { IAutoMovieVector3 } from "./IAutoMovieVector3";

/**
 * A spine path's point, unit tangent and rotation-minimizing frame under
 * chord-length parameterization.
 *
 * The normalized parameter runs by piecewise control-polygon chord length, with
 * each spine knot at its chord-length share. Evaluation returns new coordinate
 * objects. When this path wraps an updateable transport, evaluation follows its
 * current geometry and the stored length retains its value at wrapping.
 */
export interface IAutoMovieSweepPath {
  /**
   * Metre length of the input spine's control polygon when this path was
   * created. It scales the normalized chord parameter.
   */
  length: number;

  /**
   * Position on the compiled curve in model metres. Values below zero and above
   * one evaluate at the corresponding endpoint.
   *
   * @param u Chord-length parameter, clamped to [0, 1]. Supply a value other
   *   than NaN.
   * @returns Position in model metres.
   */
  point(u: number): IAutoMovieVector3;

  /**
   * Unit tangent in the direction of increasing path parameter. Endpoints use
   * their admitted end derivative directions.
   *
   * @param u Chord-length parameter, clamped to [0, 1]. Supply a value other
   *   than NaN.
   * @returns Unit tangent in model coordinates.
   */
  tangent(u: number): IAutoMovieVector3;

  /**
   * Rotation-minimizing frame whose origin lies on the spine and whose normal
   * follows the unit tangent. The transverse axes carry the starting direction
   * along the path.
   *
   * @param u Chord-length parameter, clamped to [0, 1]. Supply a value other
   *   than NaN.
   * @returns Frame at the evaluated spine position.
   */
  frame(u: number): IAutoMovieSweepFrame;
}
