/**
 * Whether a pinned target still resolves against the current design.
 *
 * Stale covers a missing element, model or part, absent geometry, an invalid
 * index, a changed authored feature count and an axis with zero computed
 * transformed direction. A stale target carries no page position and a reason
 * instead.
 */
export type AutoMovieDrawingTargetStatus = "resolved" | "stale";
