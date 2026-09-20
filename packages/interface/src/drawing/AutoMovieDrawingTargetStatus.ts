/**
 * Whether a pinned target still resolves against the current design.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `AutoMovieDrawingTargetStatus` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `AutoMovieDrawingTargetStatus` for the interior space drawing schedule quantity system contract.
 */
export type AutoMovieDrawingTargetStatus = "resolved" | "stale";
