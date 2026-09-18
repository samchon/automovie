/**
 * Shared by AUTOMOVIE_MAX_PATTERN_CELLS, IAutoMoviePatternPoint, IAutoMoviePatternExclusion, IAutoMoviePatternCandidate, AutoMovieSurfacePatternGenerator, IAutoMovieSurfacePatternZone, IAutoMovieSurfacePattern, IAutoMoviePatternPlacement, IAutoMoviePatternQuantities, IAutoMoviePatternZoneQuantities, IAutoMoviePatternFinding, IAutoMovieSurfacePatternResult, IAutoMoviePatternFaceFrame, IAutoMoviePatternFacet, IAutoMoviePatternInstancing, AutoMoviePatternTextureSheet, IAutoMoviePatternTextureTransform, IAutoMoviePatternTexturing, generateAutoMovieSurfacePattern, autoMoviePatternInstanceTransforms, autoMoviePatternTextureTransforms, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @author Samchon
 */
export const project = (
  polygon: readonly IAutoMoviePatternPoint[],
  axis: IAutoMoviePatternPoint,
): { min: number; max: number } => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const point of polygon) {
    const value = point.u * axis.u + point.v * axis.v;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  return { min, max };
};
