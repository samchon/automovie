/**
 * Family of geometric feature an annotation target addresses.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Exposes `AutoMovieDrawingFeatureKind` as the portable data boundary for the interior drawing views requirement.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Types `AutoMovieDrawingFeatureKind` for the interior space drawing schedule quantity system contract.
 */
export type AutoMovieDrawingFeatureKind =
  | "vertex"
  | "edge"
  | "face"
  | "axis"
  | "centroid";
