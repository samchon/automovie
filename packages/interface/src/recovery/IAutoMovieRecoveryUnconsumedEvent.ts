import type { IAutoMovieContourLoft64 } from "..";

/**
 * Bracketed reconstruction candidate retained outside the admitted loft event
 * population.
 */
export interface IAutoMovieRecoveryUnconsumedEvent {
  /**
   * Original bracketed event candidate with physical coordinates and available
   * incident curve ordinals.
   */
  event: IAutoMovieContourLoft64.IEvent;

  /** Why this candidate has no admitted loft event declaration. */
  reason: string;
}
