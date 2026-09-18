/**
 * Shared by generateAutoMovieSurfacePattern, autoMoviePatternTextureTransforms, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @author Samchon
 */
export const summarize = (
  zone: string,
  placements: readonly IAutoMoviePatternPlacement[],
  netRegionArea: number,
): IAutoMoviePatternZoneQuantities => {
  const coveredArea = placements.reduce((sum, one) => sum + one.area, 0);
  const consumedArea = placements.reduce(
    (sum, one) => sum + one.size.u * one.size.v,
    0,
  );
  return {
    zone,
    modules: placements.length,
    whole: placements.filter((one) => one.cut === "none").length,
    cut: placements.filter((one) => one.cut !== "none").length,
    coveredArea,
    consumedArea,
    wasteArea: consumedArea - coveredArea,
    netRegionArea,
  };
};
