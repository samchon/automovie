/**
 * Shared by IAutoMovieDrawingFeatureResolution, resolveAutoMovieDrawingFeature, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Carries the exact anchor, orientation, feature count, and stale explanation that keeps a drawing annotation traceable to current geometry.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Defines the complete resolved-or-stale result of looking up one authored drawing feature in the built environment.
 * @author Samchon
 */
export const stale = (
  reason: string,
  count = 0,
): IAutoMovieDrawingFeatureResolution => ({
  status: "stale",
  point: null,
  direction: null,
  count,
  reason,
});
