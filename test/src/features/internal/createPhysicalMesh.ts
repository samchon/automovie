import { type IAutoMovieMesh } from "@automovie/interface";

/**
 * Copy caller-owned positions and optional triangle indices into a fixture mesh with no normals/UVs/skin. Optional ids create per-slot physical source records in the supplied domain, defaulting to fixture-instance, and an identity vertex-to-source map; production consumers own length, finiteness and correspondence admission.
 *
 * The physical cache/deformation/merge/refusal entries use this constructor to vary actual input buffers and source metadata rather than expected results. O(P+I+S) copying/record work returns fresh geometry and source arrays; input mutation is isolated and no mesh or source cache survives the call.
 */
export function createPhysicalMesh(
  positions: number[],
  indices: number[] | null,
  ids?: number[],
  domain: string = "fixture-instance",
): IAutoMovieMesh {
  return {
    positions: positions.slice(),
    indices: indices?.slice() ?? null,
    normals: null,
    uvs: null,
    skin: null,
    ...(ids === undefined
      ? {}
      : {
          physicalVertices: {
            sources: ids.map((id: number): { domain: string; id: number; }  => ({ domain, id })),
            vertices: ids.map((_id: number, index: number): number  => index),
          },
        }),
  };
}
