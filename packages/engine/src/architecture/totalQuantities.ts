/**
 * Shared by generateAutoMovieSurfacePattern, autoMoviePatternTextureTransforms, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @author Samchon
 */
export const totalQuantities = (
  pattern: IAutoMovieSurfacePattern,
  placements: readonly IAutoMoviePatternPlacement[],
  zones: readonly IAutoMoviePatternZoneQuantities[],
): IAutoMoviePatternQuantities => {
  const coveredArea = zones.reduce((sum, one) => sum + one.coveredArea, 0);
  const consumedArea = zones.reduce((sum, one) => sum + one.consumedArea, 0);
  const netRegionArea = zones.reduce((sum, one) => sum + one.netRegionArea, 0);
  const wasteArea = consumedArea - coveredArea;
  const jointArea = netRegionArea - coveredArea;
  return {
    modules: placements.length,
    whole: zones.reduce((sum, one) => sum + one.whole, 0),
    cut: zones.reduce((sum, one) => sum + one.cut, 0),
    coveredArea,
    consumedArea,
    wasteArea,
    wasteRatio: consumedArea === 0 ? 0 : wasteArea / consumedArea,
    netRegionArea,
    jointArea,
    jointLength: pattern.joint === 0 ? 0 : jointArea / pattern.joint,
    zones: [...zones],
  };
};
