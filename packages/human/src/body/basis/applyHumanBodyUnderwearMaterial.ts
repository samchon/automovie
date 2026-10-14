import type { IAutoMovieModel } from "@automovie/interface";

import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { partitionHumanSkinMaterial } from "../../common/mesh/partitionHumanSkinMaterial";
import type { IHumanBodyUnderwearMaterialInput } from "../structures/IHumanBodyUnderwearMaterialInput";

/**
 * Append independent lifted fabric to one unchanged final skin region. Its cut reads carried rest coverage and actual final posed normals, after Body placement or Person stitching has completed. Fabric has its own colour and roughness rather than the skin's per-vertex colour or relief multiplier. The r16 normal-offset representation is a blocking costume; it provides no cloth fitting or self-contact guarantee. Source skin remains the anatomy and contact authority. Fabric carries no skin physical-vertex lineage. Model and portable exporter admission remain.
 *
 * @evidence contracts/common.md#principled-implementation Source-aware coverage partitions the final skin mesh, then actual posed normals lift the covered copy and recomputed normals describe the emitted fabric.
 * @evidence contracts/common.md#clear-and-simple-design The unchanged original skin and one optional independent fabric part share the source transform while fabric receives its own material and identity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mesh, normals and finite offset are required; normal lifting remains a blocking costume with no fitting or self-contact proof, rather than a substitute for source anatomy.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies final-pose timing, metre offset, independent appearance and absent skin lineage or cloth guarantee.
 * @evidence contracts/performance.md#efficient-algorithms Partitioning owns coverage clipping; lifting walks covered coordinates once and rebuilding normals walks covered faces once, without duplicating unrelated source regions here.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing final normals drive the lift, and the original part is reused directly; only changed fabric coordinates require new normals.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned parts retain the original part and covered copy; partition temporaries become unreachable after return, with no cache, external resource or pending task.
 */
export function applyHumanBodyUnderwearMaterial(
  input: IHumanBodyUnderwearMaterialInput,
): IAutoMovieModel["parts"] {
  const { part, field, sources, material, offsetMetres }: typeof input = input;
  if (part.geometry.type !== "mesh")
    throw new Error(
      "Skin-attached underwear requires its actual source mesh part.",
    );
  const partition: ReturnType<typeof partitionHumanSkinMaterial> =
    partitionHumanSkinMaterial({ mesh: part.geometry.mesh, field, sources });
  const parts: IAutoMovieModel["parts"] = [part];
  if (partition.covered.indices!.length !== 0) {
    const normals: typeof partition.covered.normals = partition.covered.normals;
    if (normals === null || !Number.isFinite(offsetMetres))
      throw new Error(
        "Underwear normal lift needs final skin normals and finite metres.",
      );
    partition.covered.positions = partition.covered.positions.map(
      (value: number, at: number): number => value + offsetMetres * normals[at],
    );
    partition.covered.normals = areaWeightedNormals(
      partition.covered.positions,
      partition.covered.indices!,
    );
    partition.covered.uvs = null;
    delete partition.covered.physicalVertices;
    delete partition.covered.colors;
    delete partition.covered.reliefWeights;
    parts.push({
      ...part,
      id: part.id + "/" + material.id,
      name: part.name + "/" + material.id,
      material: material.id,
      geometry: { type: "mesh", mesh: partition.covered },
    });
  }
  return parts;
}
