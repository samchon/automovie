import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisRegion } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasisRegion";

import type { IHumanSourceAuthoredCut } from "./structures/IHumanSourceAuthoredCut.ts";

/**
 * Rebuild exact head material regions from retained cell lineage and new roles.
 * Retained source cells preserve their original material owner. Newly authored
 * nasal rim and lining use the resident skin finish as a prototype convention,
 * in separate named regions; this does not identify their tissue histology.
 * Every current head cell must receive exactly one material owner. Retired
 * triangles are replaced by provider cells, not copied into the current view.
 */
export function buildHumanSourceAuthoredHeadRegions(
  face: IAutoMovieHumanFaceBasis,
  partition: IHumanSourceAuthoredCut,
): IAutoMovieHumanFaceBasisRegion[] {
  const skin = face.surfaces.find((surface) => surface.id === "Human");
  if (skin === undefined)
    throw new Error(
      "Authored head regions need original Human material ownership.",
    );
  const oldCellOf = new Map<string, number>();
  for (let at = 0; at < skin.indices.length; at += 3)
    oldCellOf.set(skin.indices.slice(at, at + 3).join("/"), at / 3);
  const output = skin.regions.map((region) => ({
    ...region,
    indices: [] as number[],
    uvs: region.uvs === null ? null : ([] as number[]),
  }));
  const owner = new Int32Array(partition.headIndices.length / 3).fill(-1);
  skin.regions.forEach((region, regionIndex) => {
    for (let at = 0; at < region.indices.length; at += 3) {
      const original = oldCellOf.get(
        region.indices.slice(at, at + 3).join("/"),
      );
      if (original === undefined)
        throw new Error(
          `Original head region ${region.id} names an absent oriented cell.`,
        );
      const current = partition.originalFaceTriangleToHead[original];
      if (current < 0) continue;
      if (owner[current] !== -1)
        throw new Error(
          `Current head cell ${current} has duplicate material ownership.`,
        );
      owner[current] = regionIndex;
    }
  });
  const inherited = skin.regions.find((region) => region.id.endsWith("/skin"));
  if (inherited === undefined)
    throw new Error(
      "Authored nasal regions need the declared resident skin finish.",
    );
  const nasalRegions = new Map<string, number>();
  for (let cell = 0; cell < owner.length; cell++) {
    if (owner[cell] === -1) {
      const part = partition.headPartIds[cell];
      const role = partition.headMaterialRoles[cell];
      if (
        (part !== "nasal-rim-left" &&
          part !== "nasal-rim-right" &&
          part !== "nasal-vestibule-left" &&
          part !== "nasal-vestibule-right") ||
        (role !== "inherited-native-skin" && role !== "authored-nasal-lining")
      )
        throw new Error(
          `Head cell ${cell} has no retained or explicitly authored material owner (${part}/${role}).`,
        );
      let region = nasalRegions.get(part);
      if (region === undefined) {
        region = output.length;
        nasalRegions.set(part, region);
        output.push({
          id: `Human/${part}`,
          material: inherited.material,
          indices: [],
          uvs: [],
        });
      }
      owner[cell] = region;
    }
    const region = output[owner[cell]];
    region.indices.push(
      ...partition.headIndices.subarray(3 * cell, 3 * cell + 3),
    );
    region.uvs?.push(...partition.headUv.subarray(6 * cell, 6 * cell + 6));
  }
  return output;
}
