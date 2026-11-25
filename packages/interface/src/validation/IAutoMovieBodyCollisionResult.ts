import type { IAutoMovieInteractionEvent } from "../cinematics/IAutoMovieInteractionEvent";
import type { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";
import type { IAutoMovieValidation } from "./IAutoMovieValidation";

/**
 * Return sampled inter-body validation, contact events and an optional
 * suggested response.
 */
export interface IAutoMovieBodyCollisionResult {
  /**
   * Sampled overlap warnings or admission errors; physicsIntent suppresses
   * warnings.
   */
  validation: IAutoMovieValidation;

  /** Per-sample proxy contacts on the shot clock, including suppressed warnings. */
  events: IAutoMovieInteractionEvent[];

  /**
   * Suggested response at the deepest contact; null for no contact, suppressed
   * advice or refused body/mass/restitution admission.
   */
  response: IAutoMovieCollisionResponse | null;
}
