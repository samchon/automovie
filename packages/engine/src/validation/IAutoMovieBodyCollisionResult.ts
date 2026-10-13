import {
  IAutoMovieInteractionEvent,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";

/**
 * The outcome of an inter-body collision check: the `warning`/`error` envelope,
 * the `contact` interaction events for downstream/render, and a suggested
 * response at the deepest penetration (or `null`).
 *
 * @author Samchon
 */
export interface IAutoMovieBodyCollisionResult {
  /** Warning-severity feedback (or an error for a bad sampleRate). */
  validation: IAutoMovieValidation;
  /** Contact events on the shot clock: "one calculation, two consumers". */
  events: IAutoMovieInteractionEvent[];
  /** Suggested response at the deepest contact, or `null` when none applies. */
  response: IAutoMovieCollisionResponse | null;
}
