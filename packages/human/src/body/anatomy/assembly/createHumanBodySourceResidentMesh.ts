import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IHumanBodySourceResidentMesh } from "./IHumanBodySourceResidentMesh";

/**
 * Materialize referenced source ordinals without changing a source triangle.
 *
 * Immutable source positions, bindings, fields and provenance keep their native population. This boundary emits only vertices actually used by indexed triangles. Sorted source ordinals give a deterministic bijection and retain separate shading aliases even when their coordinates coincide. Nonindexed geometry uses all vertices through its implicit triangle order.
 *
 * Original attribute cardinality and finiteness are checked before compaction; an unreferenced malformed coordinate or attribute is not discarded silently. Anatomical binding and original directional admission remain with the source assembly owner. Geometric normals, when requested, are computed on the actual resident triangles, where each vertex has incidence; there is no direction to invent for an unused source bookkeeping ordinal.
 *
 * @evidence contracts/common.md#principled-implementation Sorted referenced native ordinals deterministically compact aligned attributes while preserving triangle order and shading aliases; original attributes are admitted before selection.
 * @evidence contracts/common.md#clear-and-simple-design One compaction boundary owns resident correspondence/normals; assembly admission retains anatomical weights and original directions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unused malformed attributes cannot disappear, coincident vertices are not welded, and unused bookkeeping vertices receive no invented normal.
 * @evidence contracts/common.md#meaningful-documentation The prose defines source ownership, referenced/nonindexed populations, deterministic ordering and geometric-normal reconstruction.
 * @evidence contracts/performance.md#efficient-algorithms Attribute validation, marking and ascending ordinal selection cost O(V+T), and resident copying O(R). Optional physical correspondence additionally validates S source rows and their key text through engine, with O(V+S) temporary identity storage; ordinal/output storage is O(V+R), without sorting.
 * @evidence contracts/performance.md#reuse-equivalent-work Fully referenced geometry reuses its mesh when normals need no rebuild; otherwise one correspondence selects every attribute.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result owns selected arrays/correspondence and borrows source descriptors; temporary ordinal lookup storage dies on return or refusal.
 */
export function createHumanBodySourceResidentMesh(
  mesh: IAutoMovieMesh,
  geometricNormals: boolean = false,
): IHumanBodySourceResidentMesh {
  const count: number = mesh.positions.length / 3;
  if (
    !Number.isSafeInteger(count) ||
    count < 1 ||
    !mesh.positions.every(Number.isFinite) ||
    mesh.skin !== null
  )
    throw new Error(
      "Source resident geometry needs finite complete positions and its separate anatomical binding.",
    );
  const aligned: (values: readonly number[] | null | undefined, width: number) => void = (
    values: readonly number[] | null | undefined,
    width: number,
  ): void => {
    if (
      values !== null &&
      values !== undefined &&
      (values.length !== count * width || !values.every(Number.isFinite))
    )
      throw new Error(
        "Original source attributes must remain finite and aligned before resident compaction.",
      );
  };
  aligned(mesh.normals, 3);
  aligned(mesh.uvs, 2);
  aligned(mesh.colors, 3);
  aligned(mesh.reliefWeights, 1);
  if (
    mesh.colors?.some((value: number): boolean => value < 0 || value > 1) ||
    mesh.reliefWeights?.some((value: number): boolean => value < 0)
  )
    throw new Error(
      "Original source appearance attributes are outside their existing domain.",
    );
  if (
    mesh.physicalVertices !== undefined &&
    (mesh.physicalVertices.vertices.length !== count ||
      mesh.physicalVertices.vertices.some(
        (source: number | null): boolean =>
          source !== null &&
          (!Number.isSafeInteger(source) ||
            source < 0 ||
            source >= mesh.physicalVertices!.sources.length),
      ))
  )
    throw new Error(
      "Original physical source correspondence must address every native vertex.",
    );
  if (mesh.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(mesh);
  const indices: number[] =
    mesh.indices ?? Array.from({ length: count }, (_: unknown, vertex: number): number => vertex);
  if (
    indices.length === 0 ||
    indices.length % 3 !== 0 ||
    indices.some(
      (vertex: number): boolean =>
        !Number.isSafeInteger(vertex) || vertex < 0 || vertex >= count,
    )
  )
    throw new Error(
      "Original source triangle indices must address their complete native population.",
    );
  const resident: Int32Array = new Int32Array(count).fill(-1);
  for (const vertex of indices) resident[vertex] = 0;
  const sourceVertices: number[] = [];
  for (let vertex: number = 0; vertex < count; vertex++)
    if (resident[vertex] === 0) {
      resident[vertex] = sourceVertices.length;
      sourceVertices.push(vertex);
    }
  if (sourceVertices.length === count) {
    return {
      mesh: geometricNormals
        ? { ...mesh, normals: areaWeightedNormals(mesh.positions, indices) }
        : mesh,
      sourceVertices,
      sourceVertexCount: count,
    };
  }
  const selected: (values: readonly number[], width: number) => number[] = (values: readonly number[], width: number): number[] =>
    sourceVertices.flatMap((source: number): number[] =>
      values.slice(source * width, (source + 1) * width),
    );
  const positions: number[] = selected(mesh.positions, 3);
  const triangles: number[] = indices.map((source: number): number => resident[source]);
  const output: IAutoMovieMesh = {
    ...mesh,
    positions,
    indices: triangles,
    normals: geometricNormals
      ? areaWeightedNormals(positions, triangles)
      : mesh.normals === null
        ? null
        : selected(mesh.normals, 3),
    uvs: mesh.uvs === null ? null : selected(mesh.uvs, 2),
    ...(mesh.colors === undefined ? {} : { colors: selected(mesh.colors, 3) }),
    ...(mesh.reliefWeights === undefined
      ? {}
      : { reliefWeights: selected(mesh.reliefWeights, 1) }),
    ...(mesh.physicalVertices === undefined
      ? {}
      : {
          physicalVertices: {
            sources: mesh.physicalVertices.sources,
            vertices: sourceVertices.map(
              (source: number): number | null => mesh.physicalVertices!.vertices[source],
            ),
          },
        }),
  };
  return { mesh: output, sourceVertices, sourceVertexCount: count };
}
