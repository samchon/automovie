import type { IAutoMovieModel } from "@automovie/interface";

import { createHumanFaceBasisRegion } from "../../face/basis/createHumanFaceBasisRegion";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodyGpuRegion } from "./humanBodyGpuRegion";

/**
 * Compile the body skin's fixed UV and source-vertex correspondence once.
 *
 * Each material region's triangles and UV corners belong to the admitted
 * basis, so shape and pose edits never change their output vertex order.
 * The existing region gatherer compiles that order here; every evaluation
 * then copies the new shared Y-up, Z-forward metre positions, normals and
 * optional site colour into fresh arrays. The caller keeps the unsplit skin
 * for garment cutting. Relief weights use the same source correspondence,
 * while a seam duplicates only render vertices, not physical skin vertices.
 * `humanBodyGpuRegion` rounds UV corners to their exact GPU Float32 values
 * before correspondence is compiled, merging only values the renderer could
 * never distinguish and retaining genuine atlas seams.
 * No compiled output array is shared between document evaluations.
 */
export function createHumanBodySurfaceRegionParts(
  surface: IAutoMovieHumanBodyBasis["surfaces"][number],
): (input: {
  positions: number[];
  normals: number[];
  skinMaterial: string;
  colors: number[] | null;
  reliefWeights: number[] | null;
}) => IAutoMovieModel["parts"] {
  const regions = surface.regions.map((source) => {
    const region = humanBodyGpuRegion(source);
    return { region, gather: createHumanFaceBasisRegion(region) };
  });
  return ({ positions, normals, skinMaterial, colors, reliefWeights }) =>
    regions.map(({ region, gather }) => {
      const mesh =
        colors === null || region.material !== skinMaterial
          ? gather(positions, normals)
          : gather(positions, normals, colors);
      if (reliefWeights !== null && region.material === skinMaterial) {
        const triples = reliefWeights.flatMap((weight) => [
          weight,
          weight,
          weight,
        ]);
        const gathered = gather(triples, triples).positions;
        mesh.reliefWeights = gathered.filter((_, i) => i % 3 === 0);
      }
      return {
        id: region.id,
        name: region.id,
        material: region.material,
        geometry: { type: "mesh" as const, mesh },
        attachedBone: null,
        transform: null,
      };
    });
}
