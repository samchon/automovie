/**
 * Shared buffer construction and triangle-index admission for procedural
 * shape builders, mesh composition and topology inspection. Geometry is in
 * metres. Smooth mesh construction derives area-weighted normals from actual
 * indices and combines explicitly duplicated seam groups before normalization.
 * Flat builders append independently owned corners to their private target.
 * Index admission returns the resident array or a new sequential run without
 * mutating the source. Attribute order is shared by rendering and export.
 */
import { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/** The buffers a flat-shaded builder fills before it becomes a mesh. */
interface IMeshTarget {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
}

/**
 * Allocates independently owned mesh attributes for procedural construction.
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Allocates independently owned mesh attributes for procedural construction.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Starts a flat surface with empty position, normal, UV and triangle buffers.
 */
export const emptyMeshTarget = (): IMeshTarget => ({
  positions: [],
  normals: [],
  uvs: [],
  indices: [],
});

/**
 * Append one triangle that owns its three corners and its own plane normal.
 *
 * A lofted quad is only planar when its two sections match, so the two halves
 * of a changing section's quad genuinely face different ways. Giving each
 * triangle its own corners is what lets each carry the normal its own plane
 * has, instead of one averaged direction that neither half points in.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Builds one real triangle with independent surface attributes.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Appends three owned corners, a geometric plane normal and their metric UVs in winding order.
 */
export const pushFlatTriangle = (
  target: IMeshTarget,
  corners: readonly [
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
  ],
): void => {
  const normal = Vector3.normalize(
    Vector3.cross(
      Vector3.subtract(corners[1][0], corners[0][0]),
      Vector3.subtract(corners[2][0], corners[0][0]),
    ),
  );
  const base = target.positions.length / 3;
  for (const [point, u, v] of corners) {
    target.positions.push(point.x, point.y, point.z);
    target.normals.push(normal.x, normal.y, normal.z);
    target.uvs.push(u, v);
  }
  target.indices.push(base, base + 1, base + 2);
};

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

/**
 * The triangle index run a mesh carries, refused rather than read past its end.
 *
 * An index array that is not a whole number of triangles, or that names a
 * vertex the mesh does not carry, would otherwise read `undefined` and emit
 * `NaN` positions and a `NaN` volume that no downstream check attributes back
 * to the malformed input.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Refuses malformed mesh connectivity before geometry operations read it.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Admits whole XYZ and triangle runs and validates every referenced vertex identity.
 */
export const triangleIndicesOf = (
  mesh: IAutoMovieMesh,
  label: string,
): number[] => {
  const vertices = mesh.positions.length / 3;
  if (Number.isSafeInteger(vertices) === false)
    throw new Error(`${label} needs positions in whole xyz triples`);
  const indices =
    mesh.indices ?? Array.from({ length: vertices }, (_, index) => index);
  if (indices.length % 3 !== 0)
    throw new Error(`${label} needs triangle indices in threes`);
  if (
    indices.some(
      (index) =>
        Number.isSafeInteger(index) === false || index < 0 || index >= vertices,
    )
  )
    throw new Error(`${label} indexes a vertex the mesh does not carry`);
  return indices;
};
