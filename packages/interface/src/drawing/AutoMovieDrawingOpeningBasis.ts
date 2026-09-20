/**
 * Where an opening mark's geometry came from.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `AutoMovieDrawingOpeningBasis` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `AutoMovieDrawingOpeningBasis` for the interior space drawing schedule quantity system contract.
 */
export type AutoMovieDrawingOpeningBasis = "profile" | "fill" | "none";
