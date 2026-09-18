/**
 * Shared by autoMovieOpeningFillExtent, triangulateAutoMoviePolygon, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Fixes every bulged opening arc to the same angular sampling density so repeated drawing derivations yield identical chords.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Sets the deterministic `PI / 16` subdivision used to convert profile arcs into canonical outline segments.
 * @author Samchon
 */
export const span = (values: readonly number[]): number => {
  const range = autoMovieDrawingRange(values);
  return range.max - range.min;
};
