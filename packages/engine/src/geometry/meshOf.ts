import { Vector3 } from "../math/Vector3";
import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Produces a procedural mesh whose normals follow its actual geometry.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Produces a procedural mesh whose normals follow its actual geometry.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Constructs area-weighted smooth normals with shared seam groups before publishing the buffers.
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

const normalsOf = (
  positions: number[],
  indices: number[],
  normalGroups: readonly (readonly number[])[] = [],
): number[] => {
  const normals = new Array<number>(positions.length).fill(0);
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]! * 3;
    const b = indices[index + 1]! * 3;
    const c = indices[index + 2]! * 3;
    const ab = {
      x: positions[b]! - positions[a]!,
      y: positions[b + 1]! - positions[a + 1]!,
      z: positions[b + 2]! - positions[a + 2]!,
    };
    const ac = {
      x: positions[c]! - positions[a]!,
      y: positions[c + 1]! - positions[a + 1]!,
      z: positions[c + 2]! - positions[a + 2]!,
    };
    const normal = Vector3.cross(ab, ac);
    for (const offset of [a, b, c]) {
      normals[offset] += normal.x;
      normals[offset + 1] += normal.y;
      normals[offset + 2] += normal.z;
    }
  }
  // Combine incident face areas before normalizing duplicated smooth vertices.
  // Their positions and UVs remain separate at the texture seam.
  for (const group of normalGroups) {
    const sum = { x: 0, y: 0, z: 0 };
    for (const vertex of group) {
      sum.x += normals[vertex * 3]!;
      sum.y += normals[vertex * 3 + 1]!;
      sum.z += normals[vertex * 3 + 2]!;
    }
    for (const vertex of group) {
      normals[vertex * 3] = sum.x;
      normals[vertex * 3 + 1] = sum.y;
      normals[vertex * 3 + 2] = sum.z;
    }
  }
  for (let index = 0; index < normals.length; index += 3) {
    const normal = Vector3.normalize({
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

const normalsOf = (
  positions: number[],
  indices: number[],
  normalGroups: readonly (readonly number[])[] = [],
): number[] => {
  const normals = new Array<number>(positions.length).fill(0);
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]! * 3;
    const b = indices[index + 1]! * 3;
    const c = indices[index + 2]! * 3;
    const ab = {
      x: positions[b]! - positions[a]!,
      y: positions[b + 1]! - positions[a + 1]!,
      z: positions[b + 2]! - positions[a + 2]!,
    };
    const ac = {
      x: positions[c]! - positions[a]!,
      y: positions[c + 1]! - positions[a + 1]!,
      z: positions[c + 2]! - positions[a + 2]!,
    };
    const normal = Vector3.cross(ab, ac);
    for (const offset of [a, b, c]) {
      normals[offset] += normal.x;
      normals[offset + 1] += normal.y;
      normals[offset + 2] += normal.z;
    }
  }
  // Combine incident face areas before normalizing duplicated smooth vertices.
  // Their positions and UVs remain separate at the texture seam.
  for (const group of normalGroups) {
    const sum = { x: 0, y: 0, z: 0 };
    for (const vertex of group) {
      sum.x += normals[vertex * 3]!;
      sum.y += normals[vertex * 3 + 1]!;
      sum.z += normals[vertex * 3 + 2]!;
    }
    for (const vertex of group) {
      normals[vertex * 3] = sum.x;
      normals[vertex * 3 + 1] = sum.y;
      normals[vertex * 3 + 2] = sum.z;
    }
  }
  for (let index = 0; index < normals.length; index += 3) {
    const normal = Vector3.normalize({
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
