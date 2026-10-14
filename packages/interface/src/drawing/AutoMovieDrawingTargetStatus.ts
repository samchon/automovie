/**
 * Whether a pinned target still resolves against the current design.
 *
 * Stale covers a missing element, model or part, absent geometry, an invalid index, a changed authored feature count and an axis with zero computed transformed direction. A stale target carries no page position and a reason instead.
 *
 * @evidence contracts/common.md#principled-implementation The resolver returns stale for its element/model/part/count/index checks or exactly zero computed axis length, and resolved otherwise; it does not certify persistent feature identity, numerical conditioning or correspondence with animated renderer geometry. Drawing derivation propagates the result and can later refuse non-finite output during canonical encoding.
 * @evidence contracts/common.md#clear-and-simple-design Two literals keep the outcome binary; the specific cause lives in the record's `reason`, so consumers branch once and read the text only when they need it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target that no longer resolves is never moved to the nearest surviving feature; it is reported stale with its position withheld.
 * @evidence contracts/common.md#meaningful-documentation Lists every cause of `stale` and states what a stale record keeps and loses.
 * @author Samchon
 */
export type AutoMovieDrawingTargetStatus = "resolved" | "stale";
