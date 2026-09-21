import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Compile a material region's fixed source-to-UV correspondence once.
 * The admitted basis owns topology; an evaluation only gathers common deformed
 * positions and normals. Every result owns its arrays, including static indices
 * and UVs, so mutating a preview cannot alter later evaluations.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-connected-basis Preserves connected positions and normals across fixed material and UV seams.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-connected-basis Compiles immutable region correspondence before repeated numerical evaluation.
 */
export function createHumanFaceBasisRegion(
  region: IAutoMovieHumanFaceBasis["surfaces"][number]["regions"][number],
): (positions: number[], normals: number[]) => IAutoMovieMesh {
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
  return (positions, normals) => {
    const gather = (values: number[]): number[] => {
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
    };
  };
}
