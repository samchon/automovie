import { createHumanFaceBrowReferenceGuides } from "@automovie/human/face/anatomy/brow/createHumanFaceBrowReferenceGuides";
import { resolveHumanFaceBrows } from "@automovie/human/face/anatomy/brow/resolveHumanFaceBrows";
import { createHumanFaceSkinHost } from "@automovie/human/face/anatomy/skin/createHumanFaceSkinHost";

import { compileHumanSourceMaterialDisk } from "./compileHumanSourceMaterialDisk.ts";
import type { IHumanSourceBrowMaterialSupportInput } from "./structures/IHumanSourceBrowMaterialSupportInput.ts";

/**
 * Register the full finite reference guides used by normal brow consumers.
 * The runtime's one guide owner supplies placement, thinning, flow and every
 * station for bootstrap defaults and the actual public numerical profiles.
 * Native nearest registration retains its existing F64 and tie semantics;
 * this stage does not claim exact-nearest or clinical trajectory evidence.
 *
 * The selected native faces, not merely their vertices, enter source support.
 * Their complete corner stars and the original band define the disk's input;
 * the positive disk compiler then independently admits topology/orientation.
 * Every witnessed face must occur in the published sourceTriangles table.
 * Source geometry, requested profiles and primitive counts remain unchanged.
 * Unsupported greedy disk preparation refuses without clamping guides.
 * References and their dimensions remain explicit qualification witnesses;
 * other states still undergo the runtime's native-domain and contact checks.
 */
export function extendHumanSourceBrowMaterialSupport(
  input: IHumanSourceBrowMaterialSupportInput,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const side of ["left", "right"] as const) {
    const band = input.basis.periocular?.[side]?.browBand;
    if (band === undefined) continue;
    const surface = input.basis.surfaces.find((entry) => entry.id === band.surface);
    const partition = surface?.sourcePartition;
    if (surface === undefined || partition?.generation !== band.generation)
      throw new Error("Brow support needs its actual same-generation native surface.");
    const faces = new Set<number>();
    let guides = 0;
    let stations = 0;
    for (const reference of input.references) {
      const profile = resolveHumanFaceBrows(input.basis, reference.document.brows)[side];
      if (profile === undefined) continue;
      const positions = reference.positions.get(surface.id);
      if (positions === undefined || positions.length !== surface.positions.length)
        throw new Error("Brow support needs the normal consumer's complete native reference.");
      const host = createHumanFaceSkinHost(surface.indices, positions);
      const paths = createHumanFaceBrowReferenceGuides({
        positions, binding: { side, upper: band.upper, lower: band.lower },
        count: profile.strandCount, profile,
      });
      guides += paths.length;
      for (const path of paths)
        for (const point of path.points) {
          const seat = host.seat(point);
          faces.add(seat.triangle);
          stations++;
        }
    }
    if (faces.size === 0) continue;
    const anchors = [...new Set([
      ...band.upper, ...band.lower,
      ...[...faces].flatMap((face) => surface.indices.slice(3 * face, 3 * face + 3)),
    ])];
    const chart = compileHumanSourceMaterialDisk(
      band.generation, surface.id, surface.indices, partition.samples, anchors,
    );
    const retained = new Set(chart.sourceTriangles);
    if ([...faces].some((face) => !retained.has(face)))
      throw new Error("Brow material support omitted an actual registered native guide face.");
    (surface.materialCharts ??= {})[side === "left" ? "browLeft" : "browRight"] = chart;
    counts[`${side}:brow:guides`] = guides;
    counts[`${side}:brow:stations`] = stations;
    counts[`${side}:brow:witnessedFaces`] = faces.size;
    counts[`${side}:brow:vertices`] = chart.vertices.length;
    counts[`${side}:brow:triangles`] = chart.sourceTriangles.length;
  }
  return counts;
}
