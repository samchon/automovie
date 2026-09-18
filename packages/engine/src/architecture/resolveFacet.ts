/**
 * Shared by autoMoviePatternInstanceTransforms, autoMoviePatternTextureTransforms, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @author Samchon
 */
export const resolveFacet = (
  anchor: IAutoMoviePatternPoint,
  frame: IAutoMoviePatternFaceFrame,
  label: string,
): IAutoMovieResolvedFacet => {
  const u = unitAxis(frame.u, `${label} u`);
  const v = unitAxis(frame.v, `${label} v`);
  finiteVector(frame.origin, `${label} origin`);
  finitePoint(anchor, `${label} anchor`);
  if (Math.abs(Vector3.dot(u, v)) > 1e-6)
    throw new Error(`${label} axes must be perpendicular`);
  return { anchor, origin: frame.origin, u, v, normal: Vector3.cross(u, v) };
};
