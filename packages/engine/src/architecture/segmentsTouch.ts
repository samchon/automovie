/** Whether two segments share any point, endpoints and overlap included.  * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `PLANAR_EPSILON` fixes slack, in metres, below which two planar coordinates are the same point. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `PLANAR_EPSILON` bounds the planar epsilon policy while the engine checks finite planar topology before consuming geometry.
 * @author Samchon
 */
export const segmentsTouch = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean =>
  segmentsCross(a, b, c, d) ||
  pointOnSegment(a, c, d) ||
  pointOnSegment(b, c, d) ||
  pointOnSegment(c, a, b) ||
  pointOnSegment(d, a, b);
