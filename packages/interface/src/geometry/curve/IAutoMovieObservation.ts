import type { IAutoMovieContourLoft64 } from "./IAutoMovieContourLoft64";

/**
 * Per-call work and qualification, independent of renderable geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A strip work observation retains the canonical contour-loft counters and qualification while omitting slab endpoints and group address. Omit reuses the maintained observation owner; the remaining counts and timing are measurements, not geometry acceptance criteria.
 * @evidence contracts/development/design.md#principled-representation A strip work observation retains the canonical contour-loft counters and qualification while omitting slab endpoints and group address.
 * @evidence contracts/development/design.md#minimal-and-owned-surface tessellateAutoMovieContourStrip64 reports work through this projection of IAutoMovieContourLoft64.IResult.stripObservations.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omit reuses the maintained observation owner; the remaining counts and timing are measurements, not geometry acceptance criteria.
 */
export type IAutoMovieObservation = Omit<
  NonNullable<IAutoMovieContourLoft64.IResult["stripObservations"]>[number],
  "beforeMm" | "afterMm" | "group"
>;
