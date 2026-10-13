/**
 * Whether a pinned target still resolves against the current design.
 *
 * `stale` covers a missing element, model or part, an element without
 * geometry, an index outside the current feature family, a feature count
 * different from the authored one, and an axis collapsed by its element's
 * scale. A stale target carries no page position and a reason instead.
 *
 * @evidence contracts/common.md#principled-implementation Binary outcome of `resolveAutoMovieDrawingFeature`, which either computes a point from the current geometry or returns `stale` with a reason, never the nearest surviving feature.
 * @evidence contracts/common.md#clear-and-simple-design Two literals shared by dimensions and annotations, because both resolve the same feature type through the same function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A stale target is never relocated or approximated; its dimension or note keeps its slot with null geometry so the sheet still answers for it.
 * @evidence contracts/common.md#meaningful-documentation Lists every condition that makes a target stale and what a stale record carries in place of a position.
 * @author Samchon
 */
export type AutoMovieDrawingTargetStatus = "resolved" | "stale";
