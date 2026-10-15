import type { IAutoMovieMesh } from "@automovie/interface";
import { Vec3 } from "./Vec3";


/**
 * Rotate a mesh's positions and normals in place by `radians` about the vertical axis through
 * `pivot`.
 */
export const rotateY = (mesh: IAutoMovieMesh, pivot: Vec3, radians: number): void => {
  const c = Math.cos(radians), s = Math.sin(radians);
  for (let i = 0; i < mesh.positions.length; i += 3) {
    const x = mesh.positions[i]! - pivot[0], z = mesh.positions[i + 2]! - pivot[2];
    mesh.positions[i] = pivot[0] + c * x + s * z;
    mesh.positions[i + 2] = pivot[2] - s * x + c * z;
    const nx = mesh.normals![i]!, nz = mesh.normals![i + 2]!;
    mesh.normals![i] = c * nx + s * nz;
    mesh.normals![i + 2] = -s * nx + c * nz;
  }
};
