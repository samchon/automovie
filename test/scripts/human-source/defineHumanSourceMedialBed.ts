import type { IAutoMovieHumanFacePeriocularMedialBed } from "@automovie/human/face/structures/IAutoMovieHumanFacePeriocularMedialBed";

import { compileHumanSourceMaterialPatch } from "./compileHumanSourceMaterialPatch.ts";
import { readHumanSourceMedialBedCount } from "./readHumanSourceMedialBedCount.ts";

/**
 * Register the actual native-cell intersection of the authored medial region.
 * The shared bed-count owner supplies posterior endpoints. Exact material
 * clipping supplies crossing cells and the connector's actual skin path;
 * a vertex-only induced patch is not an admission prerequisite.
 * Legacy whole-vertex lists contain original points retained by that cut.
 * A plica containing cut points has no legacy whole-vertex path; the material
 * patch owns it. These are source conventions, not observed histology.
 */
export function defineHumanSourceMedialBed(
  positions: readonly number[],
  indices: readonly number[],
  margin: readonly number[],
  upperColumns: readonly number[],
  lowerColumns: readonly number[],
  generation: string,
  surface: string,
  samples: readonly number[],
): IAutoMovieHumanFacePeriocularMedialBed {
  const upperCount = readHumanSourceMedialBedCount(
    positions,
    margin,
    upperColumns,
  );
  const lowerCount = readHumanSourceMedialBedCount(
    positions,
    margin,
    lowerColumns,
  );
  const upper = upperColumns
    .slice(0, upperCount)
    .map((column) => margin[column]);
  const lower = lowerColumns
    .slice(0, lowerCount)
    .map((column) => margin[column]);
  const loop = [...upper, ...lower.slice(1).reverse()];
  const materialPatch = compileHumanSourceMaterialPatch(
    positions,
    indices,
    loop,
    loop[0],
    upper[upper.length - 1],
    lower[lower.length - 1],
    generation,
    surface,
    samples,
  );
  const native = (point: number): number | undefined =>
    materialPatch.nativeVertices[point] ?? undefined;
  const plica = materialPatch.plica.map(native);
  return {
    upperColumns: upperCount,
    lowerColumns: lowerCount,
    pocketVertices: [
      ...new Set(
        materialPatch.points.flatMap((_point, at) => {
          const vertex = native(at);
          return vertex === undefined ? [] : [vertex];
        }),
      ),
    ].sort((a, b) => a - b),
    plicaVertices: plica.every((vertex) => vertex !== undefined)
      ? (plica as number[])
      : [],
    materialPatch,
    qualification: "authoredConvention",
  };
}
