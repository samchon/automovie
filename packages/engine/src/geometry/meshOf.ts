import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Wrap a procedural builder's positions and indices as a rigid mesh whose
 * vertex normals are computed from its own triangles.
 *
 * Each vertex normal is the normalized sum of its incident triangles'
 * unnormalized face normals, so larger faces weigh more and the winding decides
 * the side. `normalGroups` lists vertices that duplicate one smooth point at a
 * texture seam; their sums are pooled before normalizing so the seam carries
 * one normal while its positions and UVs stay separate. A vertex no triangle
 * uses keeps the zero vector. The arrays passed in become the mesh's own and
 * must not be reused by the caller; indices are trusted, since every caller
 * generates them.
 *
 * @param positions Packed XYZ positions in metres, adopted by the mesh.
 * @param indices Triangle corner indices, adopted by the mesh.
 * @param uvs Packed UVs adopted by the mesh, or `null` for none.
 * @param normalGroups Vertex sets that share one smooth normal.
 * @returns A mesh with computed normals and no skin.
 */
export const meshOf = (
  positions: number[],
  indices: number[],
  uvs: number[] | null = null,
  normalGroups: readonly (readonly number[])[] = [],
): IAutoMovieMesh => ({
  positions,
  normals: normalsOf(positions, indices, normalGroups),
  uvs,
  indices,
  skin: null,
});

/** Area-weighted vertex normals with declared seam groups pooled. */
const normalsOf = (
  positions: readonly number[],
  indices: readonly number[],
  normalGroups: readonly (readonly number[])[],
): number[] => {
  const normals: number[] = new Array<number>(positions.length).fill(0);
  for (let index: number = 0; index + 2 < indices.length; index += 3) {
    const a: number = indices[index]! * 3;
    const b: number = indices[index + 1]! * 3;
    const c: number = indices[index + 2]! * 3;
    const ux: number = positions[b]! - positions[a]!;
    const uy: number = positions[b + 1]! - positions[a + 1]!;
    const uz: number = positions[b + 2]! - positions[a + 2]!;
    const vx: number = positions[c]! - positions[a]!;
    const vy: number = positions[c + 1]! - positions[a + 1]!;
    const vz: number = positions[c + 2]! - positions[a + 2]!;
    const nx: number = uy * vz - uz * vy;
    const ny: number = uz * vx - ux * vz;
    const nz: number = ux * vy - uy * vx;
    for (const offset of [a, b, c]) {
      normals[offset] += nx;
      normals[offset + 1] += ny;
      normals[offset + 2] += nz;
    }
  }
  for (const group of normalGroups) {
    let x: number = 0;
    let y: number = 0;
    let z: number = 0;
    for (const vertex of group) {
      x += normals[vertex * 3]!;
      y += normals[vertex * 3 + 1]!;
      z += normals[vertex * 3 + 2]!;
    }
    for (const vertex of group) {
      normals[vertex * 3] = x;
      normals[vertex * 3 + 1] = y;
      normals[vertex * 3 + 2] = z;
    }
  }
  for (let index: number = 0; index < normals.length; index += 3) {
    const normal: IAutoMovieVector3 = Vector3.normalize({
      x: normals[index]!,
      y: normals[index + 1]!,
      z: normals[index + 2]!,
    });
    normals[index] = normal.x;
    normals[index + 1] = normal.y;
    normals[index + 2] = normal.z;
  }
  return normals;
};
