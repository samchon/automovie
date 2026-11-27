import type { IAutoMovieActionTarget } from "./IAutoMovieActionTarget";

/**
 * The authored focus pull for a camera frame action.
 *
 * Its marks are relative to the frame action and `to` names the second lens
 * subject. Compilation resolves it to the distinct world-point intent shape.
 */
export interface IAutoMovieCameraActionFocusPull {
  /** Finite seconds from the frame action's start, at least zero. */
  start: number;

  /** Finite seconds from the first mark to the second, strictly positive. */
  duration: number;

  /** Positional lens subject at the second mark. */
  to: IAutoMovieActionTarget;
}
