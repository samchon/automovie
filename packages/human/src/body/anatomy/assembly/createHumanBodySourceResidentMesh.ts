import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import { areaWeightedNormals } from "../../../common/mesh/areaWeightedNormals";
import type { IHumanBodySourceResidentMesh } from "./IHumanBodySourceResidentMesh";

/**
 * Materialize referenced source ordinals without changing a source triangle.
 *
 * Immutable source positions, bindings, fields and provenance keep their native
 * population. This boundary emits only vertices actually used by indexed
 * triangles. Sorted source ordinals give a deterministic bijection and retain
 * separate shading aliases even when their coordinates coincide. Nonindexed
 * geometry uses all vertices through its implicit triangle order.
 *
 * Original attribute cardinality and finiteness are checked before compaction;
 * an unreferenced malformed coordinate or attribute is not discarded silently.
 * Anatomical binding and original directional admission remain with the source
 * assembly owner. Geometric normals, when requested, are computed on the actual
 * resident triangles, where each vertex has incidence; there is no direction to
 * invent for an unused source bookkeeping ordinal.
 */
export function createHumanBodySourceResidentMesh(
  mesh: IAutoMovieMesh,
  geometricNormals: boolean = false,
): IHumanBodySourceResidentMesh {
  const count = mesh.positions.length / 3;
  if (
    !Number.isSafeInteger(count) ||
    count < 1 ||
    !mesh.positions.every(Number.isFinite) ||
    mesh.skin !== null
  )
    throw new Error(
      "Source resident geometry needs finite complete positions and its separate anatomical binding.",
    );
  const aligned = (
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
    mesh.colors?.some((value) => value < 0 || value > 1) ||
    mesh.reliefWeights?.some((value) => value < 0)
  )
    throw new Error(
      "Original source appearance attributes are outside their existing domain.",
    );
  if (
    mesh.physicalVertices !== undefined &&
    (mesh.physicalVertices.vertices.length !== count ||
      mesh.physicalVertices.vertices.some(
        (source) =>
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
  const indices =
    mesh.indices ?? Array.from({ length: count }, (_, vertex) => vertex);
  if (
    indices.length === 0 ||
    indices.length % 3 !== 0 ||
    indices.some(
      (vertex) =>
        !Number.isSafeInteger(vertex) || vertex < 0 || vertex >= count,
    )
  )
    throw new Error(
      "Original source triangle indices must address their complete native population.",
    );
  const sourceVertices = [...new Set(indices)].sort(
    (left, right) => left - right,
  );
  if (sourceVertices.length === count) {
    return {
      mesh: geometricNormals
        ? { ...mesh, normals: areaWeightedNormals(mesh.positions, indices) }
        : mesh,
      sourceVertices,
      sourceVertexCount: count,
    };
  }
  const resident = new Int32Array(count).fill(-1);
  sourceVertices.forEach((source, vertex) => {
    resident[source] = vertex;
  });
  const selected = (values: readonly number[], width: number): number[] =>
    sourceVertices.flatMap((source) =>
      values.slice(source * width, (source + 1) * width),
    );
  const positions = selected(mesh.positions, 3);
  const triangles = indices.map((source) => resident[source]);
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
              (source) => mesh.physicalVertices!.vertices[source],
            ),
          },
        }),
  };
  return { mesh: output, sourceVertices, sourceVertexCount: count };
}
