import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";

import { compileHumanSourceAttachmentTriangles } from "./compileHumanSourceAttachmentTriangles.ts";
import { compileHumanSourceMaterialDisk } from "./compileHumanSourceMaterialDisk.ts";

/**
 * Register native support for the face's existing landmark courses and brows.
 * Each course has its own disk; a closed lip or ocular loop is never filled
 * merely to combine unrelated controls. Missing source landmarks leave their
 * course unregistered, so an active runtime consumer reports missing support.
 *
 * The glabella's source-height plane bounds an authored superior-head domain
 * for dimensioned forehead guides. Only actual incident cells are selected;
 * no cap or new geometry is emitted. This is support, not a measured forehead
 * boundary. The existing disk compiler rejects holes, branches and folds.
 * Source positions and all anatomical values remain unchanged. A changed
 * topology invalidates every registration and requires this stage again.
 */
export function registerHumanSourceMaterialCharts(
  basis: IAutoMovieHumanFaceBasis,
): void {
  const courses: Record<string, string[]> = {
    nasolabialLeft: ["alar-curvature-left", "cheilion-left"],
    nasolabialRight: ["alar-curvature-right", "cheilion-right"],
    marionetteLeft: ["cheilion-left", "gnathion"],
    marionetteRight: ["cheilion-right", "gnathion"],
    philtralLeft: ["crista-philtri-left", "subnasale"],
    philtralRight: ["crista-philtri-right", "subnasale"],
    perioralUpper: ["cheilion-right", "labiale-superius", "cheilion-left"],
    perioralLower: ["cheilion-right", "labiale-inferius", "cheilion-left"],
  };
  for (const surface of basis.surfaces) surface.materialCharts = {};
  for (const [domain, names] of Object.entries(courses)) {
    const landmarks = names.map((name) => basis.skinLandmarks?.[name]);
    const first = landmarks[0];
    if (first === undefined || landmarks.some((point) =>
      point === undefined || point.surface !== first.surface,
    )) continue;
    const surface = basis.surfaces[first.surface];
    const partition = surface?.sourcePartition;
    if (partition === undefined)
      throw new Error("Material courses need their actual source partition.");
    surface.materialCharts![domain] = compileHumanSourceMaterialDisk(
      partition.generation, surface.id, surface.indices, partition.samples,
      landmarks.map((point) => point!.vertex),
    );
  }
  const glabella = basis.skinLandmarks?.glabella;
  if (glabella !== undefined) {
    const surface = basis.surfaces[glabella.surface];
    const partition = surface?.sourcePartition;
    if (partition === undefined)
      throw new Error("Superior material support needs its actual source partition.");
    const height = surface.positions[3 * glabella.vertex + 1];
    const cells = Array.from({ length: surface.indices.length / 3 }, (_, at) => at)
      .filter((at) => surface.indices.slice(3 * at, 3 * at + 3)
        .some((vertex) => surface.positions[3 * vertex + 1] >= height));
    const superior = compileHumanSourceAttachmentTriangles(
      partition.generation, surface.id, surface.indices, partition.samples, cells,
    );
    surface.materialCharts!.forehead = superior;
    surface.materialCharts!.glabellar = superior;
  }
  for (const side of ["left", "right"] as const) {
    const band = basis.periocular?.[side]?.browBand;
    if (band === undefined) continue;
    const surface = basis.surfaces.find((candidate) => candidate.id === band.surface);
    const partition = surface?.sourcePartition;
    if (surface === undefined || partition?.generation !== band.generation)
      throw new Error("Brow material support needs its same-generation source host.");
    surface.materialCharts![side === "left" ? "browLeft" : "browRight"] = compileHumanSourceMaterialDisk(
      partition.generation, surface.id, surface.indices, partition.samples,
      [...band.upper, ...band.lower],
    );
  }
}
