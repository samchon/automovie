import type { IAutoMovieMesh } from "@automovie/interface";

/** Make an owned triangle mesh; optional point IDs assert one physical instance. */
export function createPhysicalMesh(
  positions: number[],
  indices: number[] | null,
  ids?: number[],
  domain = "fixture-instance",
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
            sources: ids.map((id) => ({ domain, id })),
            vertices: ids.map((_id, index) => index),
          },
        }),
  };
}
