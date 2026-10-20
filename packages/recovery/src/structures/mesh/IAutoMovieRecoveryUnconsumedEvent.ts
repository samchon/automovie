import type { IAutoMovieContourLoft64 } from "@automovie/engine/geometry/curve";

/**
 * Source topology event that has no consumable incident closed curve.
 *
 * @evidence contracts/common.md#principled-implementation The exact event declaration survives with an explicit reason for exclusion from reconstruction.
 * @evidence contracts/common.md#clear-and-simple-design Event data and its unconsumed cause share one record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retention of an event does not certify a displayable surface or invent an incident curve.
 * @evidence contracts/common.md#meaningful-documentation Members document physical units, ownership and optional-state meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The declaration owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the declared records and arrays.
 */
export interface IAutoMovieRecoveryUnconsumedEvent {
  /** Original physical event declaration and incident curve identities. */
  event: IAutoMovieContourLoft64.IEvent;

  /** Why no supported closed-curve reconstruction consumes this event. */
  reason: string;
}
