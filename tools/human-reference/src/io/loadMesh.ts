import type { Bone } from "../geometry/Bone.ts";
import type { Mesh } from "../geometry/Mesh.ts";
import type { V3 } from "../geometry/V3.ts";
import type { ReferenceManifest } from "./ReferenceManifest.ts";
import { readInput } from "./readInput.ts";

interface RawBone {
  index: number;
  name: string;
  parent: number;
  global_rest_matrix: number[][];
}
interface RawMesh {
  vertices: V3[];
  triangles: [number, number, number][];
  weights?: [number, number][][];
  bones: RawBone[];
  posed_global_matrices?: number[][][];
}

/**
 * Admits a saved millimetre mesh and rig from one hashed private input.
 * Matrices are row-major affine transforms; no registration or unit conversion occurs here.
 * A requested diagnostic rig pose must be present; native transforms are not its fallback.
 * Rig markers remain rig markers, without clinical landmark interpretation.
 *
 * @evidence contracts/common.md#principled-implementation Reads one hash-verified saved mesh, admits finite coordinates, triangle addresses and rig matrix shapes, then derives named rig frames without modifying source coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Owns a saved mesh adapter; source registration, skin selection, pose reconstruction and anatomical interpretation remain separate operators.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source identity, index population or coordinate constants are baked in; missing or malformed declared data fails instead of falling back.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, row-major matrices, absence of conversion and distinction between rig markers and clinical landmarks.
 * @evidence contracts/performance.md#efficient-algorithms Scans each vertex, triangle, bone and influence once after complete JSON parsing; memory scales with the saved mesh and derived bone map.
 * @evidence contracts/performance.md#reuse-equivalent-work Retains no cross-call mesh or matrix cache; each call uses its verified input buffer and derives one bone map.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reader handles close synchronously, and the returned mesh and maps belong to the caller; no timers or module-owned state persist.
 */
export function loadMesh(
  manifest: ReferenceManifest,
  id: string,
  posed: boolean = false,
): Mesh {
  const raw: RawMesh = readInput<RawMesh>(manifest, id);
  const triple = (value: unknown): value is V3 =>
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (x: unknown): boolean => typeof x === "number" && Number.isFinite(x),
    );
  if (!Array.isArray(raw.vertices) || !raw.vertices.every(triple))
    throw new Error(`Invalid finite mesh coordinates: ${id}`);
  if (
    !Array.isArray(raw.triangles) ||
    !raw.triangles.every(
      (triangle: [number, number, number]): boolean =>
        Array.isArray(triangle) &&
        triangle.length === 3 &&
        triangle.every(
          (v: number): boolean =>
            Number.isInteger(v) && v >= 0 && v < raw.vertices.length,
        ),
    )
  )
    throw new Error(`Invalid mesh triangle addresses: ${id}`);
  const matrix = (value: unknown): value is number[][] =>
    Array.isArray(value) &&
    value.length === 4 &&
    value.every(
      (row: unknown): boolean =>
        Array.isArray(row) &&
        row.length === 4 &&
        row.every(
          (x: unknown): boolean => typeof x === "number" && Number.isFinite(x),
        ),
    );
  if (
    !Array.isArray(raw.bones) ||
    !raw.bones.every(
      (bone: RawBone): boolean =>
        Number.isInteger(bone.index) &&
        typeof bone.name === "string" &&
        Number.isInteger(bone.parent) &&
        matrix(bone.global_rest_matrix),
    )
  )
    throw new Error(`Invalid saved rig transforms: ${id}`);
  if (
    new Set(raw.bones.map((bone: RawBone): string => bone.name)).size !==
      raw.bones.length ||
    raw.bones.some(
      (bone: RawBone, index: number): boolean => bone.index !== index,
    )
  )
    throw new Error(`Rig names or array indices are ambiguous: ${id}`);
  if (
    raw.posed_global_matrices &&
    (raw.posed_global_matrices.length !== raw.bones.length ||
      !raw.posed_global_matrices.every(matrix))
  )
    throw new Error(`Invalid posed rig transforms: ${id}`);
  if (
    raw.weights &&
    (raw.weights.length !== raw.vertices.length ||
      !raw.weights.every(
        (row: [number, number][]): boolean =>
          Array.isArray(row) &&
          row.every(
            (pair: [number, number]): boolean =>
              Array.isArray(pair) &&
              pair.length === 2 &&
              Number.isInteger(pair[0]) &&
              pair[0] >= 0 &&
              pair[0] < raw.bones.length &&
              Number.isFinite(pair[1]) &&
              pair[1] >= 0,
          ),
      ))
  )
    throw new Error(`Invalid saved rig influences: ${id}`);
  if (posed && !raw.posed_global_matrices)
    throw new Error(`Requested diagnostic rig pose is absent: ${id}`);
  const bones: Bone[] = raw.bones.map((bone: RawBone): Bone => {
    const transform: number[][] =
      posed && raw.posed_global_matrices
        ? raw.posed_global_matrices[bone.index]
        : bone.global_rest_matrix;
    return {
      index: bone.index,
      name: bone.name,
      parent: bone.parent,
      pos: [transform[0][3], transform[1][3], transform[2][3]],
      ax: [0, 1, 2].map(
        (column: number): V3 => [
          transform[0][column],
          transform[1][column],
          transform[2][column],
        ],
      ) as [V3, V3, V3],
    };
  });
  return {
    vertices: raw.vertices,
    triangles: raw.triangles,
    weights: raw.weights,
    bones,
    boneByName: new Map(
      bones.map((bone: Bone): [string, Bone] => [bone.name, bone]),
    ),
    restM: raw.bones.map(
      (bone: RawBone): number[][] => bone.global_rest_matrix,
    ),
    posedM: raw.posed_global_matrices,
  };
}
