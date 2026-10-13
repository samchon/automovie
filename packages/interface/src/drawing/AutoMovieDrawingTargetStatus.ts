/**
 * Whether a pinned target still resolves against the current design.
 *
 * `stale` covers a missing element, a model the design does not carry, a
 * missing part, an element without geometry, an index outside the current
 * feature family, a feature count different from the authored one, and an axis
 * collapsed by its element's scale. A stale target carries no page position
 * and a reason instead.
 *
 * @evidence contracts/common.md#principled-implementation `resolveAutoMovieDrawingFeature` returns `stale` with a sentence for each failed check and `resolved` with a world point otherwise, and the drawing copies that outcome onto the note or dimension that pinned the target.
 * @evidence contracts/common.md#clear-and-simple-design Two literals keep the outcome binary; the specific cause lives in the record's `reason`, so consumers branch once and read the text only when they need it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target that no longer resolves is never moved to the nearest surviving feature; it is reported stale with its position withheld.
 * @evidence contracts/common.md#meaningful-documentation Lists every cause of `stale` and states what a stale record keeps and loses.
 * @author Samchon
 */
export type AutoMovieDrawingTargetStatus = "resolved" | "stale";
