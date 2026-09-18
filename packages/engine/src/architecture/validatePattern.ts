/**
 * Shared by generateAutoMovieSurfacePattern, autoMoviePatternTextureTransforms, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @author Samchon
 */
export const validatePattern = (
  pattern: IAutoMovieSurfacePattern,
): IAutoMoviePatternPoint[][] => {
  nonBlank(pattern.id, "pattern id");
  if (pattern.zones.length === 0)
    throw new Error("a surface pattern needs at least one zone");
  atLeast(pattern.joint, 0, "pattern joint");
  atLeast(pattern.jointTolerance, 0, "pattern joint tolerance");
  atLeast(pattern.adjacency, 0, "pattern adjacency");
  if (
    !Number.isFinite(pattern.minimumPiece) ||
    pattern.minimumPiece <= 0 ||
    pattern.minimumPiece > 1
  )
    throw new Error("pattern minimum piece must be a finite number in (0, 1]");
  if (pattern.grainToleranceDeg !== null)
    atLeast(pattern.grainToleranceDeg, 0, "pattern grain tolerance");
  if (!Number.isSafeInteger(pattern.seed) || pattern.seed < 0)
    throw new Error("pattern seed must be a safe integer >= 0");
  if (!Number.isSafeInteger(pattern.variants) || pattern.variants < 1)
    throw new Error("pattern variants must be a safe integer >= 1");

  const zoneIds = new Set<string>();
  pattern.zones.forEach((zone, index) => {
    nonBlank(zone.id, `pattern zone[${index}] id`);
    if (zoneIds.has(zone.id))
      throw new Error(`pattern zone id "${zone.id}" must be unique`);
    zoneIds.add(zone.id);
    finitePoint(zone.origin, `pattern zone "${zone.id}" origin`);
    positive(zone.period.u, `pattern zone "${zone.id}" period u`);
    positive(zone.period.v, `pattern zone "${zone.id}" period v`);
    positive(zone.reach.u, `pattern zone "${zone.id}" reach u`);
    positive(zone.reach.v, `pattern zone "${zone.id}" reach v`);
  });

  const exclusionIds = new Set<string>();
  const exclusions = pattern.exclusions.map((exclusion, index) => {
    nonBlank(exclusion.id, `pattern exclusion[${index}] id`);
    if (exclusionIds.has(exclusion.id))
      throw new Error(`pattern exclusion id "${exclusion.id}" must be unique`);
    exclusionIds.add(exclusion.id);
    return convexPolygon(
      exclusion.polygon,
      `pattern exclusion "${exclusion.id}" polygon`,
    );
  });
  for (let left = 0; left < exclusions.length; ++left)
    for (let right = left + 1; right < exclusions.length; ++right)
      if (
        polygonArea(clipConvex(exclusions[left]!, exclusions[right]!)) >
        AREA_EPSILON
      )
        throw new Error(
          `pattern exclusions "${pattern.exclusions[left]!.id}" and "${pattern.exclusions[right]!.id}" overlap`,
        );
  return exclusions;
};
