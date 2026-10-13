import {
  IAutoMovieClip,
  IAutoMovieInteractionEvent,
  IAutoMovieValidation,
} from "@automovie/interface";

/**
 * The outcome of a gravity-expectation check: the `warning` envelope, the
 * `fall` interaction event(s), and a suggested fall trajectory (or `null`).
 *
 * @author Samchon
 */
export interface IAutoMovieFreeFallResult {
  /** Warning-severity feedback (or an error for bad input). */
  validation: IAutoMovieValidation;
  /** Fall events on the shot clock: "one calculation, two consumers". */
  events: IAutoMovieInteractionEvent[];
  /**
   * Suggested free-fall arc from this frame, or `null` when not expected to
   * fall.
   */
  trajectory: IAutoMovieClip | null;
}
