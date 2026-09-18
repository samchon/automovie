/** Whether a point lies on a segment, its endpoints included.  * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `PLANAR_EPSILON` fixes slack, in metres, below which two planar coordinates are the same point. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `PLANAR_EPSILON` bounds the planar epsilon policy while the engine checks finite planar topology before consuming geometry.
 * @author Samchon
 */
export const pointOnSegment = (
  point: IAutoMoviePlanarPoint,
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
): boolean =>
  side(from, to, point) === 0 &&
  point.x >= Math.min(from.x, to.x) - PLANAR_EPSILON &&
  point.x <= Math.max(from.x, to.x) + PLANAR_EPSILON &&
  point.y >= Math.min(from.y, to.y) - PLANAR_EPSILON &&
  point.y <= Math.max(from.y, to.y) + PLANAR_EPSILON;
