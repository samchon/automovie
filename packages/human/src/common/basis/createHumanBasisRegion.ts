import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanMaterialRegion } from "../structures/IHumanMaterialRegion";

/**
 * Compile a material region's fixed source-to-UV correspondence once.
 * The admitted basis owns topology; an evaluation only gathers common deformed
 * positions, normals and optional reference colour. Every result owns its arrays, including static indices
 * and UVs, so mutating a preview cannot alter later evaluations.
 */
export function createHumanBasisRegion(
  region: IHumanMaterialRegion,
): (
  positions: readonly number[],
  normals: readonly number[],
  colors?: readonly number[],
) => IAutoMovieMesh {
  const vertices = new Map<string, number>();
  const sources: number[] = [];
  const indices: number[] = [];
  const uvs: number[] | null = region.uvs === null ? null : [];
  region.indices.forEach((source, corner) => {
    const uv = region.uvs?.slice(corner * 2, corner * 2 + 2);
    const key = `${source}/${uv?.join(",") ?? ""}`;
    let index = vertices.get(key);
    if (index === undefined) {
      index = vertices.size;
      vertices.set(key, index);
      sources.push(source);
      if (uv !== undefined) uvs!.push(...uv);
    }
    indices.push(index);
  });
  return (positions, normals, colors) => {
    const gather = (values: readonly number[]): number[] => {
      const output = new Array<number>(sources.length * 3);
      for (let i = 0; i < sources.length; i++)
        for (let axis = 0; axis < 3; axis++)
          output[i * 3 + axis] = values[sources[i] * 3 + axis];
      return output;
    };
    return {
      positions: gather(positions),
      normals: gather(normals),
      indices: indices.slice(),
      uvs: uvs?.slice() ?? null,
      skin: null,
      ...(colors === undefined ? {} : { colors: gather(colors) }),
    };
  };
}
