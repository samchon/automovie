/**
 * Shared by autoMovieOpeningOutlinePoints, autoMovieOpeningArea, triangulateAutoMoviePolygon, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-drawing-views Fixes every bulged opening arc to the same angular sampling density so repeated drawing derivations yield identical chords.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Sets the deterministic `PI / 16` subdivision used to convert profile arcs into canonical outline segments.
 * @author Samchon
 */
export const arcOf = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  bulge: number,
): IArc | null => {
  if (Math.abs(bulge) <= BULGE_EPSILON) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const chord = Math.hypot(dx, dy);
  if (chord <= BULGE_EPSILON) return null;
  // The bulge is `tan(|sweep| / 4)` and, in this design's convention, a positive
  // one bulges to the LEFT of the edge's own direction — the same convention
  // `outlineHull` places its sagitta by, because two spellings of which way an
  // arch curves is one spelling too many. The centre therefore sits on the
  // opposite side of the chord from the bulge, at the signed distance below,
  // which runs off to infinity exactly as the bulge goes to zero and the arc
  // becomes the chord; and the sweep runs clockwise for a positive bulge, which
  // is what puts the arc on the left.
  const offset = (chord * (1 - bulge * bulge)) / (4 * bulge);
  const center = {
    x: (from.x + to.x) / 2 + (offset * dy) / chord,
    y: (from.y + to.y) / 2 - (offset * dx) / chord,
  };
  return {
    center,
    radius: Math.hypot(chord / 2, offset),
    start: Math.atan2(from.y - center.y, from.x - center.x),
    sweep: -4 * Math.atan(bulge),
  };
};
