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
 * @evidence contracts/common.md#principled-implementation Summing the area-weighted normals of the two vertices at one seam point gives the normal of the surface around that point, which is the smooth-shading normal of a surface the lattice only cut for parameterisation. The vertex pairing is exact because the lattice layout is row-major with columns + 1 vertices per row.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the rows pairs the two edge columns; nothing else about the mesh changes, and no search or tolerance is involved.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shape, subject or fixture is special-cased; the caller declares the seam by passing the lattice's own column count.
 * @evidence contracts/common.md#meaningful-documentation The comment states what is welded, what is preserved, the layout assumption and the caller's obligation that the columns coincide.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part; it adjusts the normals of a mesh a part builder supplies.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitives; the vertex and triangle counts are unchanged.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function moves and converts no position; only unit normals are recomputed.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function welds shading within one mesh and builds no boundary between parts.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no displayed part; the pinna builder that calls it observes the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function is not an input through which a caller shapes a human form.
 */
export function weldLatticeSeamNormals(
  mesh: IAutoMovieMesh,
  columns: number,
  rows: number,
): IAutoMovieMesh {
  if (mesh.normals === null || mesh.normals === undefined)
    return { ...mesh };
  const width = columns + 1;
  if (mesh.normals.length !== 3 * width * (rows + 1))
    throw new Error("The lattice's normals must match its columns and rows.");
  const normals = [...mesh.normals];
  for (let row = 0; row <= rows; row++) {
    const a = 3 * row * width,
      b = a + 3 * columns;
    const sum = [0, 1, 2].map((axis) => mesh.normals![a + axis] + mesh.normals![b + axis]);
    const length = Math.hypot(...sum);
    if (length === 0) continue;
    for (let axis = 0; axis < 3; axis++) {
      normals[a + axis] = sum[axis] / length;
      normals[b + axis] = sum[axis] / length;
    }
  }
  return { ...mesh, normals };
}
