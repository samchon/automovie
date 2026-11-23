import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieValidation } from "./IAutoMovieValidation";

/** Advice, fall events and an optional trajectory returned by detectFreeFall. */
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
