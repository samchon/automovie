import type { IAutoMovieModel } from "@automovie/interface";

import { partitionHumanSkinMaterial } from "../../common/mesh/partitionHumanSkinMaterial";
import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IHumanBodyUnderwearMaterialInput } from "../structures/IHumanBodyUnderwearMaterialInput";

/**
 * Append independent lifted fabric to one unchanged final skin region.
 * Its cut reads carried rest coverage and actual final posed normals, after
 * Body placement or Person stitching has completed.
 * Fabric has its own colour and roughness rather than the skin's per-vertex
 * colour or relief multiplier. The r16 normal-offset representation is a
 * blocking costume; it provides no cloth fitting or self-contact guarantee.
 * Source skin remains the anatomy and contact authority. Fabric carries no
 * skin physical-vertex lineage. Model and portable exporter admission remain.
 */
export function applyHumanBodyUnderwearMaterial(
  input: IHumanBodyUnderwearMaterialInput,
): IAutoMovieModel["parts"] {
  const { part, field, sources, material, offsetMetres } = input;
  if (part.geometry.type !== "mesh")
    throw new Error("Skin-attached underwear requires its actual source mesh part.");
  const partition = partitionHumanSkinMaterial({ mesh: part.geometry.mesh, field, sources });
  const parts: IAutoMovieModel["parts"] = [part];
  if (partition.covered.indices!.length !== 0) {
    const normals = partition.covered.normals;
    if (normals === null || !Number.isFinite(offsetMetres))
      throw new Error("Underwear normal lift needs final skin normals and finite metres.");
    partition.covered.positions = partition.covered.positions.map(
      (value, at) => value + offsetMetres * normals[at],
    );
    partition.covered.normals = areaWeightedNormals(
      partition.covered.positions, partition.covered.indices!,
    );
    partition.covered.uvs = null;
    delete partition.covered.physicalVertices;
    delete partition.covered.colors;
    delete partition.covered.reliefWeights;
    parts.push({ ...part, id: part.id + "/" + material.id,
      name: part.name + "/" + material.id, material: material.id,
      geometry: { type: "mesh", mesh: partition.covered } });
  }
  return parts;
}
