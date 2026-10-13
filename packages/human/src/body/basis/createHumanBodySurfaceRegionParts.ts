import type { IAutoMovieModel } from "@automovie/interface";

import { createHumanBasisRegion } from "../../common/basis/createHumanBasisRegion";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IHumanBodySurfaceRegionInput } from "./IHumanBodySurfaceRegionInput";
import { humanBodyGpuRegion } from "./humanBodyGpuRegion";

/**
 * Compile the body skin's fixed UV and source-vertex correspondence once.
 *
 * Each material region's triangles and UV corners belong to the admitted basis, so shape and pose edits never change their output vertex order. The existing region gatherer compiles that order here; every evaluation then copies the new shared Y-up, Z-forward metre positions, normals and optional site colour into fresh arrays. The caller keeps the unsplit skin for garment cutting. Relief weights use the same source correspondence, while a seam duplicates only render vertices, not physical skin vertices. `humanBodyGpuRegion` rounds UV corners to their exact GPU Float32 values before correspondence is compiled, merging only values the renderer could never distinguish and retaining genuine atlas seams. No compiled output array is shared between document evaluations. Supplied physical samples use that same corner table; absent registration preserves legacy output. The caller owns source and actual instance binding.
 *
 * @evidence contracts/common.md#principled-implementation GPU-rounded UV corners compile the region-to-source correspondence once, then the same gatherer carries final positions, normals, skin colour, relief weights and optional physical samples into render seams.
 * @evidence contracts/common.md#clear-and-simple-design Each compiled region pairs its authored record with one gather closure; each document returns independent mesh parts in that stable order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Seam duplicates remain render vertices rather than invented physical skin identity; absent source registration preserves metadata absence and no contact or anatomical certificate is inferred.
 * @evidence contracts/common.md#meaningful-documentation The prose names source order, Float32 UV identity, gathered channels, fresh output ownership and caller-owned physical instance binding.
 * @evidence contracts/performance.md#efficient-algorithms Correspondence compilation is paid once per region; each evaluation gathers render vertices linearly, with a separate linear triple/gather/filter pass only for requested skin relief.
 * @evidence contracts/performance.md#reuse-equivalent-work Stable admitted region topology and UV correspondence are reused across shape and pose documents; changing the source region requires recompilation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Compiled region records and gather mappings remain with the closure; returned meshes own their arrays and relief temporaries expire after evaluation, without external handles or pending work.
 */
export function createHumanBodySurfaceRegionParts(
  surface: IAutoMovieHumanBodyBasis["surfaces"][number],
): (input: IHumanBodySurfaceRegionInput) => IAutoMovieModel["parts"] {
  const regions: { region: ReturnType<typeof humanBodyGpuRegion>; gather: ReturnType<typeof createHumanBasisRegion> }[] = surface.regions.map((source: typeof surface.regions[number]): { region: ReturnType<typeof humanBodyGpuRegion>; gather: ReturnType<typeof createHumanBasisRegion> } => {
    const region: ReturnType<typeof humanBodyGpuRegion> = humanBodyGpuRegion(source);
    return { region, gather: createHumanBasisRegion(region) };
  });
  return ({
    positions,
    normals,
    skinMaterial,
    colors,
    reliefWeights,
    physical,
  }: IHumanBodySurfaceRegionInput): IAutoMovieModel["parts"] =>
    regions.map(({ region, gather }: typeof regions[number]): IAutoMovieModel["parts"][number] => {
      const mesh: ReturnType<ReturnType<typeof createHumanBasisRegion>> =
        colors === null || region.material !== skinMaterial
          ? gather(positions, normals, undefined, physical)
          : gather(positions, normals, colors, physical);
      if (reliefWeights !== null && region.material === skinMaterial) {
        const triples: number[] = reliefWeights.flatMap((weight: number): number[] => [
          weight,
          weight,
          weight,
        ]);
        const gathered: number[] = gather(triples, triples).positions;
        mesh.reliefWeights = gathered.filter((_: number, i: number): boolean => i % 3 === 0);
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
