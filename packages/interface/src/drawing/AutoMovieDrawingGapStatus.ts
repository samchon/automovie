/**
 * Whether a derivation is missing entirely or merely had nothing to run on.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `AutoMovieDrawingGapStatus` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `AutoMovieDrawingGapStatus` for the interior space drawing schedule quantity system contract.
 */
export type AutoMovieDrawingGapStatus = "unsupported" | "not-run";
