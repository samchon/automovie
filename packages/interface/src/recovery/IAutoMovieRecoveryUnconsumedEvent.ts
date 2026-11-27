import type { IAutoMovieContourLoft64 } from "..";

/** Source topology event that has no consumable incident closed curve. */
export interface IAutoMovieRecoveryUnconsumedEvent {
  /** Original physical event declaration and incident curve identities. */
  event: IAutoMovieContourLoft64.IEvent;

  /** Why no supported closed-curve reconstruction consumes this event. */
  reason: string;
}
