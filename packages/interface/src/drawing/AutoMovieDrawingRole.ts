/**
 * One drafted line's relation to the cut plane and the view depth.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `AutoMovieDrawingRole` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `AutoMovieDrawingRole` for the interior space drawing schedule quantity system contract.
 */
export type AutoMovieDrawingRole = "cut" | "projected" | "overhead" | "hidden";
