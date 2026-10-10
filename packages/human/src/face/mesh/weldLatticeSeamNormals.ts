import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * Give the two edge columns of a `triangulateSurfaceLattice` grid one shared
 * normal per row, without merging or moving any vertex.
 *
 * A lattice whose first and last column are the same closed curve (a closed
 * outline sampled with `u = 0` and `u = 1`) holds two vertices at each seam
 * point. Each gets a normal from only its own triangles, so shading jumps
 * across the seam. For every row `j`, the vertices `j * (columns + 1)` and
 * `j * (columns + 1) + columns` receive the normalised sum of their normals; a
 * row whose sum is zero keeps its normals. Positions and indices are reused
 * unchanged, so topology, winding and every consumer's vertex numbering stay
 * valid. The caller states that the two columns coincide: this function does
 * not test it, and welding columns that are not the same curve would smooth a
 * real edge. A mesh without normals is returned as a shallow copy.
 */
export function weldLatticeSeamNormals(
  mesh: IAutoMovieMesh,
  columns: number,
  rows: number,
): IAutoMovieMesh {
  if (mesh.normals === null || mesh.normals === undefined) return { ...mesh };
  const width = columns + 1;
  if (mesh.normals.length !== 3 * width * (rows + 1))
    throw new Error("The lattice's normals must match its columns and rows.");
  const normals = [...mesh.normals];
  for (let row = 0; row <= rows; row++) {
    const a = 3 * row * width,
      b = a + 3 * columns;
    const sum = [0, 1, 2].map(
      (axis) => mesh.normals![a + axis] + mesh.normals![b + axis],
    );
    const length = Math.hypot(...sum);
    if (length === 0) continue;
    for (let axis = 0; axis < 3; axis++) {
      normals[a + axis] = sum[axis] / length;
      normals[b + axis] = sum[axis] / length;
    }
  }
  return { ...mesh, normals };
}
