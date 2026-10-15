import type { IAutoMovieMesh } from "@automovie/interface";
import { IPoint } from "./IPoint";


/** Vertex `index` of a mesh. */
export const point = (mesh: IAutoMovieMesh, index: number): IPoint => ({
  x: mesh.positions[3 * index]!,
  y: mesh.positions[3 * index + 1]!,
  z: mesh.positions[3 * index + 2]!,
});
