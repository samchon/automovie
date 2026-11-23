import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieToppling } from "./IAutoMovieToppling";
import type { IAutoMovieValidation } from "./IAutoMovieValidation";

/** Support advice, fall events and a nullable topple from detectSupportToppling. */
export interface IAutoMovieSupportResult {
  /** Warning-severity feedback (or an error for bad input). */
  validation: IAutoMovieValidation;

  /** Fall events on the shot clock: "one calculation, two consumers". */
  events: IAutoMovieInteractionEvent[];

  /** Suggested topple, or `null` when supported. */
  toppling: IAutoMovieToppling | null;
}
