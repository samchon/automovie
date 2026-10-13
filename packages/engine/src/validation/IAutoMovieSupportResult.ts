import {
  IAutoMovieInteractionEvent,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IAutoMovieToppling } from "./IAutoMovieToppling";

/**
 * The outcome of a support check: the `warning` envelope, the `fall`
 * interaction event(s), and a suggested topple (or `null` when stably
 * supported).
 *
 * @author Samchon
 */
export interface IAutoMovieSupportResult {
  /** Warning-severity feedback (or an error for bad input). */
  validation: IAutoMovieValidation;
  /** Fall events on the shot clock: "one calculation, two consumers". */
  events: IAutoMovieInteractionEvent[];
  /** Suggested topple, or `null` when supported. */
  toppling: IAutoMovieToppling | null;
}
