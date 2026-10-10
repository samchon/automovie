import type { IAutoMovieMesh } from "@automovie/interface";

import type { IHumanMaterialRegion } from "../structures/IHumanMaterialRegion";
import type { IHumanPhysicalSampleRegistration } from "../structures/IHumanPhysicalSampleRegistration";
import { humanBasisRegionCorners } from "./humanBasisRegionCorners";

/**
 * Compile a material region's fixed source-to-UV correspondence once.
 * The admitted basis owns topology; an evaluation only gathers common deformed
 * positions, normals and optional reference colour. Every result owns its arrays, including static indices
 * and UVs, so mutating a preview cannot alter later evaluations.
 * Optional physical registration maps the connected surface's canonical sample
 * IDs through this same UV table. Its domain names the current figure instance
 * and registered generation, not a normal island or the generation alone.
 * The engine still admits alias coordinate agreement and all model geometry.
 * Omission preserves the existing position-derived topology.
 */
export function createHumanBasisRegion(
  region: IHumanMaterialRegion,
): (
  positions: readonly number[],
  normals: readonly number[],
  colors?: readonly number[],
  physical?: IHumanPhysicalSampleRegistration,
) => IAutoMovieMesh {
  const { sources, indices, uvs } = humanBasisRegionCorners(region);
  return (positions, normals, colors, physical) => {
    if (
      physical !== undefined &&
      (physical.domain.trim().length === 0 ||
        physical.samples.length !== positions.length / 3 ||
        Array.from(physical.samples).some(
          (id) => !Number.isSafeInteger(id) || id < 0,
        ))
    )
      throw new Error(
        "Human region physical registration needs an instance domain and dense canonical samples aligned with its connected surface.",
      );
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
      ...(physical === undefined
        ? {}
        : {
            physicalVertices: {
              sources: sources.map((source) => ({
                domain: physical.domain,
                id: physical.samples[source],
              })),
              vertices: sources.map((_, vertex) => vertex),
            },
          }),
    };
  };
}
