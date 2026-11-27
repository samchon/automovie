/**
 * Gaze of one eye from straight ahead, degrees. The bounds are the engine's
 * conventional eye range (convention).
 */
export interface IAutoMovieHumanEyePose {
  /**
   * Vertical gaze: positive up, negative down, 30 each way. Schema constraints:
   * Minimum: -30; Maximum: 30; retained by Human's schema refinement.
   */
  vertical?: number;

  /**
   * Horizontal gaze: positive toward the person's left, negative toward the
   * right, 45 each way. Schema constraints: Minimum: -45; Maximum: 45; retained
   * by Human's schema refinement.
   */
  horizontal?: number;
}
