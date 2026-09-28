import type { IAutoMovieModel } from "@automovie/interface";

import { createHumanFaceBasisRegion } from "../../face/basis/createHumanFaceBasisRegion";
import { humanFaceBasisRegion } from "../../face/basis/humanFaceBasisRegion";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

/**
 * Project one body's posed shared skin into its authored material regions.
 *
 * The unsplit Y-up, Z-forward metre positions and normals stay with the
 * caller for garment cutting. Each region gathers its own UV and source
 * correspondence into a fresh mesh. Site colour and pose-dependent relief
 * weights follow that same correspondence, so seams duplicate vertices for
 * rendering without changing the shared skin's shape or vertex identity.
 * The body uses the existing region gatherer for this correspondence.
 */
export function createHumanBodySurfaceRegionParts(input: {
  surface: IAutoMovieHumanBodyBasis["surfaces"][number];
  positions: number[];
  normals: number[];
  skinMaterial: string;
  colors: number[] | null;
  reliefWeights: number[] | null;
}): IAutoMovieModel["parts"] {
  const { surface, positions, normals, skinMaterial, colors, reliefWeights } =
    input;
  return surface.regions.map((region) => {
    const mesh =
      colors === null || region.material !== skinMaterial
        ? humanFaceBasisRegion(positions, normals, region)
        : createHumanFaceBasisRegion(region)(positions, normals, colors);
    if (reliefWeights !== null && region.material === skinMaterial) {
      const triples = reliefWeights.flatMap((weight) => [
        weight,
        weight,
        weight,
      ]);
      const gathered = createHumanFaceBasisRegion(region)(
        triples,
        triples,
      ).positions;
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
