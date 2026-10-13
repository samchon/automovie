/**
 * Whether a pinned target still resolves against the current design.
 *
 * `stale` covers a missing element, model or part, an element without
 * geometry, an index outside the current feature family, a feature count
 * different from the authored one, and an axis collapsed by its element's
 * scale. A stale target carries no page position and a reason instead.
 *
 * @author Samchon
 */
export type AutoMovieDrawingTargetStatus = "resolved" | "stale";
