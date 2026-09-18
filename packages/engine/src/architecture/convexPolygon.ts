/**
 * Canonicalize an authored polygon to a counter-clockwise convex outline.
 *
 * The hull is taken and then compared with the input, so a reflex corner, an
 * interior point, a repeated point, and a point sitting on an edge are all
 * refused instead of being silently absorbed. That is the same refusal the
 * procedural profile kernel makes, for the same reason: a clipper fed a
 * non-convex outline reports areas the surface does not have.
  * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @author Samchon
 */
export const convexPolygon = (
  polygon: readonly IAutoMoviePatternPoint[],
  label: string,
): IAutoMoviePatternPoint[] => {
  polygon.forEach((point, index) => finitePoint(point, `${label}[${index}]`));
  const hull = convexHull2D(
    polygon.map((point) => ({ x: point.u, y: 0, z: point.v })),
  ).map((point) => ({ u: point.x, v: point.z }));
  if (hull.length < 3)
    throw new Error(`${label} needs at least three non-collinear points`);
  if (hull.length !== polygon.length)
    throw new Error(`${label} must be convex and contain no interior points`);
  return hull;
};
