import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { compileHumanSourceMaterialPatch } from "./compileHumanSourceMaterialPatch.ts";
import { registerHumanSourceMaterialCharts } from "./registerHumanSourceMaterialCharts.ts";
import { registerHumanSourcePeriocularBoundaryCourses } from "./registerHumanSourcePeriocularBoundaryCourses.ts";

/**
 * Compile the source-native material registrations before reference evaluation.
 * Source geometry, endpoints, station order and values remain unchanged.
 * Anterior station rows retain every native boundary knot. Landmark courses
 * and brows receive their own registered disks; medial beds
 * receive native ordered boundaries and the same original host-triangle
 * correspondence consumed by tissue. The returned counts describe actual
 * compiled metadata and supply no model, clinical or rendered acceptance.
 * The caller owns this parsed source and publication of the complete result.
 */
export function compileHumanSourceNativeRegistration(
  basis: IAutoMovieHumanFaceBasis,
): Record<string, number> {
  registerHumanSourceMaterialCharts(basis);
  const counts: Record<string, number> = registerHumanSourcePeriocularBoundaryCourses(basis);
  for (const surface of basis.surfaces)
    for (const [domain, chart] of Object.entries(surface.materialCharts ?? {})) {
      counts[`${surface.id}:${domain}:vertices`] = chart.vertices.length;
      counts[`${surface.id}:${domain}:triangles`] = chart.indices.length / 3;
    }
  for (const side of ["left", "right"] as const) {
    const cage = basis.periocular?.[side]?.cage;
    if (cage === undefined) continue;
    const host = basis.surfaces.find((surface) => surface.id === cage.surface);
    if (host?.sourcePartition === undefined ||
        host.sourcePartition.generation !== cage.generation)
      throw new Error("Native material registration needs the same-generation host.");
    const bed = cage.medialBed;
    const margin = cage.stations.find((station) => station.role === "posteriorMargin");
    if (bed === undefined || margin === undefined) continue;
    const upper = cage.upperColumns.slice(0, bed.upperColumns)
      .map((column) => margin.vertices[column]);
    const lower = cage.lowerColumns.slice(0, bed.lowerColumns)
      .map((column) => margin.vertices[column]);
    const loop = [...upper, ...lower.slice(1).reverse()];
    bed.materialPatch = compileHumanSourceMaterialPatch(
      host.positions, host.indices, loop, loop[0], upper.at(-1)!, lower.at(-1)!,
      cage.generation, cage.surface, host.sourcePartition.samples,
    );
    counts[`${side}:medial:points`] = bed.materialPatch.points.length;
    counts[`${side}:medial:triangles`] = bed.materialPatch.indices.length / 3;
    counts[`${side}:medial:plicaPoints`] = bed.materialPatch.plica.length;
  }
  if (Object.keys(counts).length === 0)
    throw new Error("Native material registration compiled no source domains.");
  return counts;
}
