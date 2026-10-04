import type { IAutoMovieModel } from "@automovie/interface";

import { createHumanBasisRegion } from "../../common/basis/createHumanBasisRegion";
import type { IHumanPhysicalSampleRegistration } from "../../common/structures/IHumanPhysicalSampleRegistration";
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
 * Supplied physical samples use that same corner table; absent registration
 * preserves legacy output. The caller owns source and actual instance binding.
 * @evidence contracts/common.md#principled-implementation One authoritative source-to-UV gather copies physical sample identity with performed XYZ instead of reconstructing it from coordinates.
 * @evidence contracts/common.md#clear-and-simple-design The region projection consumes explicit correspondence and delegates its admission to the existing gatherer and engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UV ordinals, normal islands and coordinate contact never become source identity.
 * @evidence contracts/common.md#meaningful-documentation States shared incidence, default absence and output ownership.
 */
export function createHumanBodySurfaceRegionParts(
  surface: IAutoMovieHumanBodyBasis["surfaces"][number],
): (input: {
  positions: number[];
  normals: number[];
  skinMaterial: string;
  colors: number[] | null;
  reliefWeights: number[] | null;
  physical?: IHumanPhysicalSampleRegistration;
}) => IAutoMovieModel["parts"] {
  const regions = surface.regions.map((source) => {
    const region = humanBodyGpuRegion(source);
    return { region, gather: createHumanBasisRegion(region) };
  });
  return ({ positions, normals, skinMaterial, colors, reliefWeights, physical }) =>
    regions.map(({ region, gather }) => {
      const mesh =
        colors === null || region.material !== skinMaterial
          ? gather(positions, normals, undefined, physical)
          : gather(positions, normals, colors, physical);
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
