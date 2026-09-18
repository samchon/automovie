import { seededValue } from "../math/seededValue";
import { AUTOMOVIE_MAX_PATTERN_CELLS } from "./AUTOMOVIE_MAX_PATTERN_CELLS";
import { IAutoMoviePatternPlacement } from "./IAutoMoviePatternPlacement";
import { IAutoMoviePatternZoneQuantities } from "./IAutoMoviePatternZoneQuantities";
import { IAutoMovieSurfacePattern } from "./IAutoMovieSurfacePattern";
import { IAutoMovieSurfacePatternResult } from "./IAutoMovieSurfacePatternResult";

/**
 * Lay one pattern and measure exactly what was laid.
 *
 * The run is a fixed sequence so two runs of the same declaration produce
 * byte-identical output on every platform: zones in declaration order, lattice
 * rows outermost and columns innermost, and each cell's modules in the order
 * the author's generator returned them. Nothing samples a clock, a hash
 * iteration order, or `Math.random`; the only randomness is {@link seededValue},
 * drawn from the pattern seed and the occurrence id.
 *
 * Every module is clipped to its own zone region, then measured against every
 * exclusion. A module the region rejects entirely is not a zero-area
 * occurrence, it is absent. What survives carries the coverage it kept, why it
 * was cut, and the identity that the mesh, the instance slot, the finish, and
 * the take-off all cite, so a quantity can be traced back to the exact piece it
 * counted.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `generateAutoMovieSurfacePattern` lays one pattern and measures exactly what was laid. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `generateAutoMovieSurfacePattern` performs auto movie surface pattern generation when the engine resolves the declared physical-module pattern deterministically.
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-cuts-borders `generateAutoMovieSurfacePattern` clips lattice cells against zones and exclusions, distinguishes full, cut, and unsupported pieces, enforces minimum pieces, and reports exact waste.
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-deterministic-variation `generateAutoMovieSurfacePattern` derives each occurrence variant from the stable pattern seed and stable occurrence identity instead of draw order or frame time.
 * @evidence requirements/interior/grain-seams-and-continuity.md#interior-grain-continuity-evidence `generateAutoMovieSurfacePattern` returns each piece identity, outline, grain, mirror and variant together with measured grain-break findings.
 * @evidence requirements/interior/joints-edges-and-transitions.md#interior-joint-repetition-exception `generateAutoMovieSurfacePattern` applies explicit zone and exclusion overrides to the repeated joint lattice without changing unaffected occurrences.
 * @evidence requirements/interior/joints-edges-and-transitions.md#interior-joint-validation `generateAutoMovieSurfacePattern` emits overlap, joint-deviation, sliver, unsupported-piece, and grain-break findings at the exact affected occurrence.
 * @evidence specifications/interior-space/surface-assemblies.md#interior-space-joint-edge-grain-continuity The result preserves piece-level grain and joint observations needed to validate the laid surface without claiming source-stock provenance.
 * @evidence requirements/building-exterior/patterns-and-instances.md#building-exterior-pattern-continuity `generateAutoMovieSurfacePattern` lays the same developed lattice through declared exterior facets, cuts, exclusions, and stable occurrence identities.
 * @evidence specifications/building-envelope/external-assets-patterns-and-instances.md#building-envelope-pattern-input-output The generator consumes the declared exterior pattern domain and returns deterministic pieces, cuts, variants, findings, and quantities.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-physical-module `generateAutoMovieSurfacePattern` expands the declared physical module, period, offset, reach, and host zones into measured piece geometry and quantities.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-procedural-rule `generateAutoMovieSurfacePattern` executes only the declared generator, zone, lattice, clipping, and exclusion rules rather than inferring a decorative layout.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-deterministic-variation `generateAutoMovieSurfacePattern` derives bounded variants from the stable seed and occurrence identity so traversal and frame order cannot change them.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-pattern-boundary-exception `generateAutoMovieSurfacePattern` retains clipped and excluded boundary occurrences as separately identified cut pieces or explicit unsupported findings.
 * @evidence requirements/asset-authoring/patterns-and-procedural-composition.md#asset-pattern-local-stability `generateAutoMovieSurfacePattern` preserves every unaffected stable occurrence identity when a local zone, exclusion, or cut changes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-procedural-pattern-inputs The generator consumes explicit module, domain, seed, boundary, and exception inputs and returns deterministic occurrence identities, geometry, variants, and findings.
 * @evidence requirements/interior/groups-instances-and-repetition.md#interior-group-bounded-expansion `generateAutoMovieSurfacePattern` refuses a repeated surface expansion beyond its exported cell ceiling before materializing occurrences.
 * @evidence requirements/interior/groups-instances-and-repetition.md#interior-group-identity-preservation `generateAutoMovieSurfacePattern` derives stable occurrence identities and keeps clipped boundary exceptions distinct from full repeated pieces.
 * @evidence specifications/interior-space/external-assets-and-groups.md#interior-space-repeated-group-identity The generator implements the bounded repeated-piece identity subset without claiming arbitrary nested subject groups or room-storey repetition.
 */
export const generateAutoMovieSurfacePattern = (props: {
  pattern: IAutoMovieSurfacePattern;
}): IAutoMovieSurfacePatternResult => {
  const { pattern } = props;
  const exclusions = validatePattern(pattern);
  const placements: IAutoMoviePatternPlacement[] = [];
  const zoneQuantities: IAutoMoviePatternZoneQuantities[] = [];

  pattern.zones.forEach((zone, zoneIndex) => {
    const region = convexPolygon(
      zone.region,
      `pattern zone[${zoneIndex}] region`,
    );
    for (let other = 0; other < zoneIndex; ++other)
      if (
        polygonArea(
          clipConvex(
            region,
            convexPolygon(
              pattern.zones[other]!.region,
              `pattern zone[${other}] region`,
            ),
          ),
        ) > AREA_EPSILON
      )
        throw new Error(
          `pattern zones "${pattern.zones[other]!.id}" and "${zone.id}" overlap`,
        );
    const bounds = boundsOf(region);
    const columns = latticeRange(
      bounds.minU,
      bounds.maxU,
      zone.origin.u,
      zone.period.u,
      zone.reach.u,
    );
    const rows = latticeRange(
      bounds.minV,
      bounds.maxV,
      zone.origin.v,
      zone.period.v,
      zone.reach.v,
    );
    const cells = (columns.max - columns.min + 1) * (rows.max - rows.min + 1);
    if (cells > AUTOMOVIE_MAX_PATTERN_CELLS)
      throw new Error(
        `pattern zone "${zone.id}" spans ${cells} lattice cells, above the ${AUTOMOVIE_MAX_PATTERN_CELLS} cell limit`,
      );
    const netRegionArea =
      polygonArea(region) -
      exclusions.reduce(
        (sum, exclusion) => sum + polygonArea(clipConvex(region, exclusion)),
        0,
      );
    const seen = new Set<string>();
    const start = placements.length;
    for (let row = rows.min; row <= rows.max; ++row)
      for (let column = columns.min; column <= columns.max; ++column) {
        const origin = {
          u: zone.origin.u + column * zone.period.u,
          v: zone.origin.v + row * zone.period.v,
        };
        for (const candidate of zone.generate({
          column,
          row,
          origin,
          period: { u: zone.period.u, v: zone.period.v },
        })) {
          const outline = clipConvex(
            validateCandidate(zone, candidate, origin, seen),
            region,
          );
          const clipped = polygonArea(outline);
          if (clipped <= AREA_EPSILON) continue;
          const removed = exclusions.reduce(
            (sum, exclusion) =>
              sum + polygonArea(clipConvex(outline, exclusion)),
            0,
          );
          const area = clipped - removed;
          if (area <= AREA_EPSILON) continue;
          const moduleArea = candidate.size.u * candidate.size.v;
          const id = `${zone.id}/${candidate.id}`;
          const boundaryCut = clipped < moduleArea - AREA_EPSILON;
          const punched = removed > AREA_EPSILON;
          placements.push({
            id,
            zone: zone.id,
            module: candidate.id,
            material: zone.material,
            center: { u: candidate.center.u, v: candidate.center.v },
            size: { u: candidate.size.u, v: candidate.size.v },
            rotationDeg: candidate.rotationDeg,
            grainDeg: candidate.grainDeg,
            mirror: candidate.mirror,
            area,
            coverage: area / moduleArea,
            cut:
              boundaryCut && punched
                ? "both"
                : boundaryCut
                  ? "boundary"
                  : punched
                    ? "exclusion"
                    : "none",
            variant: variantOf(pattern, id),
            outline,
            punchedArea: punched ? removed : 0,
          });
        }
      }
    zoneQuantities.push(
      summarize(zone.id, placements.slice(start), netRegionArea),
    );
  });

  return {
    id: pattern.id,
    placements,
    quantities: totalQuantities(pattern, placements, zoneQuantities),
    findings: findingsOf(pattern, placements),
  };
};
