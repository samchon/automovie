/** Whether two segments meet at a point interior to both.  * @evidence requirements/asset-authoring/validation.md#asset-geometry-validation `PLANAR_EPSILON` fixes slack, in metres, below which two planar coordinates are the same point. This ensures degenerate or self-intersecting planar geometry is rejected before use.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-numeric-structure `PLANAR_EPSILON` bounds the planar epsilon policy while the engine checks finite planar topology before consuming geometry.
 * @author Samchon
 */
export const segmentsCross = (
  a: IAutoMoviePlanarPoint,
  b: IAutoMoviePlanarPoint,
  c: IAutoMoviePlanarPoint,
  d: IAutoMoviePlanarPoint,
): boolean => {
  const first = side(c, d, a);
  const second = side(c, d, b);
  const third = side(a, b, c);
  const fourth = side(a, b, d);
  return (
    first !== 0 &&
    second !== 0 &&
    third !== 0 &&
    fourth !== 0 &&
    first !== second &&
    third !== fourth
  );
};
