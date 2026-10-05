import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonSourceSurface } from "../structures/IAutoMovieHumanPersonSourceSurface";
import { isHumanPersonSourceIndex as integer } from "./isHumanPersonSourceIndex";

/**
 * Admit one partition's source record against its surface: a named
 * generation and finite source domain, parent triangles of three distinct
 * original ids, strict original-edge cut stencils, parent-bound affine
 * refinements (barycentric payloads refused), normal domains for every parent
 * corner, normal parents for every vertex, and cell maps matching the
 * surface's vertex and triangle populations. Each failure refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Every id and fraction the plan later reads is admitted before it is read.
 * @evidence contracts/common.md#clear-and-simple-design One pass per record table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported barycentric refinements refuse instead of being converted.
 * @evidence contracts/common.md#meaningful-documentation States every condition and the refusal.
 * @evidence contracts/modeling.md#shared-boundaries Admits the cut table both partitions share before their samples are compared.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Ids and affine fractions are dimensionless.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The conditions are topological, not anatomical.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function validateHumanPersonSourceDomain(
  record: IAutoMovieHumanBasisSourcePartition,
  surface: IAutoMovieHumanPersonSourceSurface,
): void {
  const sampleCount = record.originalVertices + record.intersections.length + (record.refinements?.length ?? 0);
  if (
    record.generation.trim() === "" ||
    !Number.isSafeInteger(record.originalVertices) ||
    record.originalVertices < 3 ||
    !Number.isSafeInteger(sampleCount) ||
    record.parentTriangles.length === 0 ||
    record.parentTriangles.length % 3 !== 0
  )
    throw new Error("Person source partition needs a finite source domain and generation.");
  for (let at = 0; at < record.parentTriangles.length; at += 3) {
    const ids = [record.parentTriangles[at], record.parentTriangles[at + 1], record.parentTriangles[at + 2]];
    if (ids.some((id) => !integer(id, record.originalVertices)) || new Set(ids).size !== 3)
      throw new Error("Person source parent triangles need three distinct original IDs.");
  }
  for (const point of record.intersections)
    if (
      point === undefined ||
      !integer(point.a, record.originalVertices) ||
      !integer(point.b, record.originalVertices) ||
      point.a === point.b ||
      !Number.isFinite(point.t) ||
      !(point.t > 0 && point.t < 1)
    )
      throw new Error("Person source cut samples need strict finite original-edge stencils.");
  for (const point of record.refinements ?? []) {
    if (point === undefined || "barycentric" in point)
      throw new Error(
        "Person source refinements require explicit affine coordinates; barycentric payloads are unsupported.",
      );
    if (!integer(point.parent, record.parentTriangles.length / 3) || point.coordinates?.length !== 2)
      throw new Error("Person source refinements need parent-bound affine coordinates.");
    interpolateHumanBasisSourceTriangle([0, 0, 0], point.coordinates);
  }
  if (
    record.parentNormalDomains !== undefined &&
    (record.parentNormalDomains.length !== record.parentTriangles.length ||
      [...record.parentNormalDomains].some((id) => !Number.isSafeInteger(id) || id < 0))
  )
    throw new Error("Person source normal domains must name every parent corner.");
  if (
    record.normalParents !== undefined &&
    (record.normalParents.length !== record.samples.length ||
      [...record.normalParents].some((id) => !integer(id, record.parentTriangles.length / 3)))
  )
    throw new Error("Person source normal parents must match the vertex population.");
  if (
    surface.positions.length % 3 !== 0 ||
    surface.indices.length % 3 !== 0 ||
    record.samples.length !== surface.positions.length / 3 ||
    record.parents.length !== surface.indices.length / 3 ||
    [...record.samples].some((id) => !integer(id, sampleCount)) ||
    [...record.parents].some((id) => !integer(id, record.parentTriangles.length / 3)) ||
    [...surface.indices].some((id) => !integer(id, record.samples.length))
  )
    throw new Error("Person source cell maps must match surface vertex and triangle domains.");
}
