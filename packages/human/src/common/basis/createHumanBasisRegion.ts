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
 * IDs through this same UV table under the supplied nonblank namespace. Body
 * and resident-face publishers supply instance-and-source registration domains;
 * the oral assembler first uses an internal working domain and binds those
 * samples to its actual instance at publication. This gatherer does not
 * authenticate that namespace or perform the publication binding.
 * The engine still admits alias coordinate agreement and all model geometry.
 * Omission preserves the existing position-derived topology.
 *
 * @evidence contracts/common.md#principled-implementation Compiles canonical source/UV correspondence, gathers current fields through it, and validates optional dense safe physical samples and a nonblank supplied namespace; the caller owns source registration and final instance binding.
 * @evidence contracts/common.md#clear-and-simple-design A closure separates fixed correspondence from evaluated attributes; outputs copy indices/UVs so preview mutation cannot alter later evaluations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent physical registration preserves position-derived incidence instead of fabricating lineage; the engine still owns geometry/alias admission.
 * @evidence contracts/common.md#meaningful-documentation Documents topology ownership, fresh output arrays and optional colour and physical registration.
 * @evidence contracts/performance.md#efficient-algorithms Compile costs O(C) corners; evaluation gathers O(U) render vertices and copies O(C) indices, adding an O(V) connected-sample scan only for physical registration.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares only compiled region correspondence; each call supplies current positions/normals/colours/physical IDs and receives fresh mesh arrays.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the closure's O(U+C) table and each returned mesh; dropping the closure releases its state, with no handle/task acquired.
 */
export function createHumanBasisRegion(
  region: IHumanMaterialRegion,
): (
  positions: readonly number[],
  normals: readonly number[],
  colors?: readonly number[],
  physical?: IHumanPhysicalSampleRegistration,
) => IAutoMovieMesh {
  const { sources, indices, uvs }: ReturnType<typeof humanBasisRegionCorners> = humanBasisRegionCorners(region);
  return (positions: readonly number[], normals: readonly number[], colors?: readonly number[], physical?: IHumanPhysicalSampleRegistration): IAutoMovieMesh => {
    if (
      physical !== undefined &&
      (physical.domain.trim().length === 0 ||
        physical.samples.length !== positions.length / 3 ||
        Array.from(physical.samples).some(
          (id: number): boolean => !Number.isSafeInteger(id) || id < 0,
        ))
    )
      throw new Error(
        "Human region physical registration needs an instance domain and dense canonical samples aligned with its connected surface.",
      );
    const gather: (values: readonly number[]) => number[] = (values: readonly number[]): number[] => {
      const output: number[] = new Array<number>(sources.length * 3);
      for (let i: number = 0; i < sources.length; i++)
        for (let axis: number = 0; axis < 3; axis++)
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
              sources: sources.map((source: number): import("@automovie/interface").IAutoMovieMeshPhysicalSource => ({
                domain: physical.domain,
                id: physical.samples[source],
              })),
              vertices: sources.map((_: number, vertex: number): number => vertex),
            },
          }),
    };
  };
}
