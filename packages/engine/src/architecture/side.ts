/** Which side of the directed line `from -> to` a point falls on.  * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `PLANAR_EPSILON` fixes slack, in metres, below which two planar coordinates are the same point. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `PLANAR_EPSILON` bounds the planar epsilon policy while the engine checks finite planar topology before consuming geometry.
 * @author Samchon
 */
export const side = (
  from: IAutoMoviePlanarPoint,
  to: IAutoMoviePlanarPoint,
  point: IAutoMoviePlanarPoint,
): number => {
  const cross =
    (to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x);
  const scale = Math.max(
    1,
    Math.abs(to.x - from.x) + Math.abs(to.y - from.y),
    Math.abs(point.x - from.x) + Math.abs(point.y - from.y),
  );
  if (Math.abs(cross) <= PLANAR_EPSILON * scale) return 0;
  return cross > 0 ? 1 : -1;
};
