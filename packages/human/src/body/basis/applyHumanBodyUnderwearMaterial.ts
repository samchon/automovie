import type { IAutoMovieModel } from "@automovie/interface";

import { partitionHumanSkinMaterial } from "../../common/mesh/partitionHumanSkinMaterial";
import type { IHumanBodyUnderwearMaterialInput } from "../structures/IHumanBodyUnderwearMaterialInput";

/**
 * Replace one final skin region by complementary skin and fabric parts.
 * Both parts retain the source transform and physical contour correspondence.
 * Fabric has its own colour and roughness rather than the skin's per-vertex
 * colour or relief multiplier. No overlapping area or displaced geometry is
 * appended. Final model and portable exporter admission remain unchanged.
 */
export function applyHumanBodyUnderwearMaterial(
  input: IHumanBodyUnderwearMaterialInput,
): IAutoMovieModel["parts"] {
  const { part, field, sources, material } = input;
  if (part.geometry.type !== "mesh")
    throw new Error("Skin-attached underwear requires its actual source mesh part.");
  const partition = partitionHumanSkinMaterial({ mesh: part.geometry.mesh, field, sources });
  const parts: IAutoMovieModel["parts"] = [];
  if (partition.uncovered.indices!.length !== 0)
    parts.push({ ...part, geometry: { type: "mesh", mesh: partition.uncovered } });
  if (partition.covered.indices!.length !== 0) {
    delete partition.covered.colors;
    delete partition.covered.reliefWeights;
    parts.push({ ...part, id: part.id + "/" + material.id,
      name: part.name + "/" + material.id, material: material.id,
      geometry: { type: "mesh", mesh: partition.covered } });
  }
  return parts;
}
