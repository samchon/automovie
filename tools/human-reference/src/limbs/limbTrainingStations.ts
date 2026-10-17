import type { Section } from "../schema/Section.ts";
import type { LimbStation } from "./LimbStation.ts";

/**
 * Subdivides consecutive physical anchor intervals without moving their boundaries.
 * Spacing is a diagnostic resolution in millimetres, not an anatomical coefficient.
 * An output interval's midpoint remains available for a disjoint validation cut.
 *
 * @evidence contracts/common.md#principled-implementation Equal subdivisions bound each interval by the requested spacing while preserving all original anchor definitions. The source family must be ordered along one straight rig segment.
 * @evidence contracts/common.md#clear-and-simple-design This function owns only the axial sampling grid; source intersections and fitted surfaces remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No identity, measurement result or consumer-specific adjustment appears in the subdivision.
 * @evidence contracts/common.md#meaningful-documentation Documents millimetres, inherited boundaries, source ordering and the validation midpoint policy.
 * @evidence contracts/performance.md#efficient-algorithms Visits the anchors once and sorts the resulting station list, using O(n log n) time and O(n) retained output for n stations.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing anchor objects are reused exactly, preserving their source boundary coordinates and metadata.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates only the returned station list; the caller owns its lifetime and no handles or cache survive this call.
 */
export function limbTrainingStations(
  anchors: Section[],
  lengthMm: number,
  spacingMm: number,
): LimbStation[] {
  const stations: LimbStation[] = anchors.map(
    (anchor: Section): LimbStation => ({
      mm: anchor.station.fraction * lengthMm,
      anchor,
    }),
  );
  for (let i: number = 1; i < anchors.length; i++) {
    const begin: number = anchors[i - 1].station.fraction * lengthMm;
    const end: number = anchors[i].station.fraction * lengthMm;
    const count: number = Math.ceil((end - begin) / spacingMm);
    for (let j: number = 1; j < count; j++)
      stations.push({ mm: begin + ((end - begin) * j) / count });
  }
  stations.sort((a: LimbStation, b: LimbStation): number => a.mm - b.mm);
  return stations;
}
