import type { IAutoMovieMesh } from "@automovie/interface";
import { Vec3 } from "./Vec3";


/** Append a quad of four vertices with one normal and per-vertex UVs as two triangles. */
export const quad = (mesh: IAutoMovieMesh, vertices: readonly Vec3[], normal: Vec3,
  uv: (v: Vec3) => readonly [number, number]): void => {
  const first = mesh.positions.length / 3;
  for (const v of vertices) {
    mesh.positions.push(...v);
    mesh.normals!.push(...normal);
    mesh.uvs!.push(...uv(v));
  }
  mesh.indices!.push(first, first + 1, first + 2, first, first + 2, first + 3);
};
