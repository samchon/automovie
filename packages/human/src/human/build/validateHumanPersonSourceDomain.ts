import type { IAutoMovieHumanBasisSourcePartition } from "../../common/basis/IAutoMovieHumanBasisSourcePartition";
import { interpolateHumanBasisSourceTriangle } from "../../common/basis/interpolateHumanBasisSourceTriangle";
import type { IAutoMovieHumanPersonSourceSurface } from "../structures/IAutoMovieHumanPersonSourceSurface";
import { isHumanPersonSourceIndex as integer } from "./isHumanPersonSourceIndex";

/**
 * Admit one source partition's dimensionless index/chart domain against its surface populations. Require nonempty generation, safe original/sample counts, distinct ordered parent corners, strict finite original-edge cuts, parent-bound two-coordinate affine refinements and aligned sample/parent/optional normal-domain selectors. Stored barycentric refinement payloads refuse rather than being silently converted.
 *
 * Input shape/types are source schema premises; this routine checks index and chart metadata, not finite position values, complete chart coverage or physical geometry. Inputs remain unchanged. Performed geometry and complementary coverage have separate owners, and valid metadata establishes no clinical source qualification.
 *
 * @evidence contracts/common.md#principled-implementation Safe resident IDs and exact vertex/triangle populations bind original, cut and ordered affine-refinement samples to their declared parent/source domain.
 * @evidence contracts/common.md#clear-and-simple-design Domain and scalar-chart admission precede complementary coverage and performed geometry rather than duplicating those later owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsafe IDs, endpoint-degenerate cuts, unsupported payloads and misaligned selectors refuse; metadata validity supplies no invented finite/embedded geometry or clinical source measurement.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies dimensionless chart/index conventions, schema premises, unchanged arrays and actual admission scope.
 * @evidence contracts/performance.md#efficient-algorithms Parent/cut/refinement/selector/sample/index passes are linear in actual stored arrays; each refinement invokes fixed three-value/two-coordinate scalar admission without allocating the original namespace extent.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each source record/surface pair is admitted from its actual metadata; this validator owns no cache across caller mutations or shared request coordinator.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only fixed-size parent tuples and linear temporary spread arrays are used; successful admission retains no input record, geometry buffer or running task.
 */
export function validateHumanPersonSourceDomain(
  record: IAutoMovieHumanBasisSourcePartition,
  surface: IAutoMovieHumanPersonSourceSurface,
): void {
  const sampleCount: number =
    record.originalVertices +
    record.intersections.length +
    (record.refinements?.length ?? 0);
  if (
    record.generation.trim() === "" ||
    !Number.isSafeInteger(record.originalVertices) ||
    record.originalVertices < 3 ||
    !Number.isSafeInteger(sampleCount) ||
    record.parentTriangles.length === 0 ||
    record.parentTriangles.length % 3 !== 0
  )
    throw new Error(
      "Person source partition needs a finite source domain and generation.",
    );
  for (let at: number = 0; at < record.parentTriangles.length; at += 3) {
    const ids: number[] = [
      record.parentTriangles[at],
      record.parentTriangles[at + 1],
      record.parentTriangles[at + 2],
    ];
    if (
      ids.some((id: number): boolean => !integer(id, record.originalVertices)) ||
      new Set(ids).size !== 3
    )
      throw new Error(
        "Person source parent triangles need three distinct original IDs.",
      );
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
      throw new Error(
        "Person source cut samples need strict finite original-edge stencils.",
      );
  for (const point of record.refinements ?? []) {
    if (point === undefined || "barycentric" in point)
      throw new Error(
        "Person source refinements require explicit affine coordinates; barycentric payloads are unsupported.",
      );
    if (
      !integer(point.parent, record.parentTriangles.length / 3) ||
      point.coordinates?.length !== 2
    )
      throw new Error(
        "Person source refinements need parent-bound affine coordinates.",
      );
    interpolateHumanBasisSourceTriangle([0, 0, 0], point.coordinates);
  }
  if (
    record.parentNormalDomains !== undefined &&
    (record.parentNormalDomains.length !== record.parentTriangles.length ||
      [...record.parentNormalDomains].some(
        (id: number): boolean => !Number.isSafeInteger(id) || id < 0,
      ))
  )
    throw new Error(
      "Person source normal domains must name every parent corner.",
    );
  if (
    record.normalParents !== undefined &&
    (record.normalParents.length !== record.samples.length ||
      [...record.normalParents].some(
        (id: number): boolean => !integer(id, record.parentTriangles.length / 3),
      ))
  )
    throw new Error(
      "Person source normal parents must match the vertex population.",
    );
  if (
    surface.positions.length % 3 !== 0 ||
    surface.indices.length % 3 !== 0 ||
    record.samples.length !== surface.positions.length / 3 ||
    record.parents.length !== surface.indices.length / 3 ||
    [...record.samples].some((id: number): boolean => !integer(id, sampleCount)) ||
    [...record.parents].some(
      (id: number): boolean => !integer(id, record.parentTriangles.length / 3),
    ) ||
    [...surface.indices].some((id: number): boolean => !integer(id, record.samples.length))
  )
    throw new Error(
      "Person source cell maps must match surface vertex and triangle domains.",
    );
}
