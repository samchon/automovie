import type { IAutoMovieContourLoft64 } from "@automovie/engine";

/**
 * Source topology event that has no consumable incident closed curve.
 *
 * @evidence contracts/development/design.md#principled-representation The exact event declaration survives with an explicit reason for exclusion from reconstruction.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Event data and its unconsumed cause share one record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retention of an event does not certify a displayable surface or invent an incident curve.
 * @evidence contracts/development/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 */
export interface IAutoMovieRecoveryUnconsumedEvent {
  /** Original physical event declaration and incident curve identities. */
  event: IAutoMovieContourLoft64.IEvent;

  /** Why no supported closed-curve reconstruction consumes this event. */
  reason: string;
}
