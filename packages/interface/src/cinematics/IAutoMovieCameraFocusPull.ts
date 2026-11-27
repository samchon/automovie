import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The timed second focus mark recorded on a compiled camera intent.
 */
export interface IAutoMovieCameraFocusPull {
  /** Shot-local seconds of the first mark, at or after the frame start. */
  start: number;

  /** Shot-local seconds of the second mark, strictly after the first. */
  end: number;

  /** World focus point in metres at the second mark. */
  to: IAutoMovieVector3;
}