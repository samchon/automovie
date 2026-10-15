import type { IAutoMovieMesh } from "@automovie/interface";
import { Vec } from "./Vec";

/** Read only weather-side triangles from a roof owner's current mesh. */

export const roofTriangles = (
  mesh: IAutoMovieMesh
): { vertices: readonly [Vec, Vec, Vec]; normal: Vec; }[] => {
  const indices = mesh.indices;
  if (indices === null || mesh.normals === null)
    throw new Error("roof mesh needs indices and normals");
  const result: { vertices: readonly [Vec, Vec, Vec]; normal: Vec; }[] = [];
  for (let i = 0; i < indices.length; i += 3) {
    const read = (at: number): Vec => {
      const o = indices[i + at]! * 3;
      return [
        mesh.positions[o]!,
        mesh.positions[o + 1]!,
        mesh.positions[o + 2]!,
      ];
    };
    const no = indices[i]! * 3;
    const normal: Vec = [
      mesh.normals[no]!,
      mesh.normals[no + 1]!,
      mesh.normals[no + 2]!,
    ];
    if (normal[1] > 0.5)
      result.push({ vertices: [read(0), read(1), read(2)], normal });
  }
  return result;
};
