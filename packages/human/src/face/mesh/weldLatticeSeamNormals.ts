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
 *
 * @evidence contracts/common.md#principled-implementation Each coincident first/last column pair receives the normalized sum of its existing area-weighted normals; zero sums preserve both inputs. The caller owns seam coincidence and finite normals, while this function refuses an array size inconsistent with lattice dimensions.
 * @evidence contracts/common.md#clear-and-simple-design Normal welding is separate from topology generation so ear front/back lattices keep their original vertices, winding, and numbering while sharing only seam shading.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No position tolerance, specimen id, duplicated surface, or forced direction invents seam correspondence; unmatched endpoints remain a caller violation rather than being moved together.
 * @evidence contracts/common.md#meaningful-documentation The comment gives row-major endpoint identities, normalized sums, zero-sum preservation, unchanged geometry/numbering, caller coincidence, and the shallow-copy behavior without normals.
 * @evidence contracts/performance.md#efficient-algorithms Copies N normal scalars once and updates R+1 row endpoints in O(N+R) time/O(N) output space; no triangle rebuild is needed because topology remains unchanged.
 * @evidence contracts/performance.md#reuse-equivalent-work The output reuses positions, indices and other attributes by identity while cloning only normals; there is no cross-request cache claiming mutable meshes are equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The copied normal array transfers in the returned shallow mesh and three-component row sums expire locally; this synchronous function retains no input or external resource after return/refusal.
 */
export function weldLatticeSeamNormals(
  mesh: IAutoMovieMesh,
  columns: number,
  rows: number,
): IAutoMovieMesh {
  if (mesh.normals === null || mesh.normals === undefined) return { ...mesh };
  const width: number = columns + 1;
  if (mesh.normals.length !== 3 * width * (rows + 1))
    throw new Error("The lattice's normals must match its columns and rows.");
  const normals: number[] = [...mesh.normals];
  for (let row: number = 0; row <= rows; row++) {
    const a: number = 3 * row * width,
      b: number = a + 3 * columns;
    const sum: number[] = [0, 1, 2].map(
      (axis: number): number => mesh.normals![a + axis] + mesh.normals![b + axis],
    );
    const length: number = Math.hypot(...sum);
    if (length === 0) continue;
    for (let axis: number = 0; axis < 3; axis++) {
      normals[a + axis] = sum[axis] / length;
      normals[b + axis] = sum[axis] / length;
    }
  }
  return { ...mesh, normals };
}
