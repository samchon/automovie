import type { IAutoMovieModel } from "@automovie/interface";

import { partitionHumanSkinMaterial } from "../../common/mesh/partitionHumanSkinMaterial";
import type { IHumanBodyUnderwearMaterialInput } from "../structures/IHumanBodyUnderwearMaterialInput";

/**
 * Replace one final skin region by complementary skin and fabric parts.
 * Both parts retain the source transform and physical contour correspondence.
 * Fabric has its own colour and roughness rather than the skin's per-vertex
 * colour or relief multiplier. No overlapping area or displaced geometry is
 * appended. Final model and portable exporter admission remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Complementary incidence assigns one material to each source surface area; the original performed geometry and local transform remain authoritative.
 * @evidence contracts/common.md#clear-and-simple-design One final part composition delegates the shared clipping calculation and names its two outputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Fabric is a normal portable material part, without shader-only overlays or arbitrary depth bias.
 * @evidence contracts/common.md#meaningful-documentation States surface replacement, retained transform and independent fabric finish.
 * @evidence contracts/modeling.md#part-identity-and-grouping Uncovered skin retains its part identity; covered fabric receives that region identity plus its reserved material id.
 * @evidence contracts/modeling.md#shared-boundaries The partition owner supplies the same exact source-edge samples on both sides.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The partition calculation owns triangle emission.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes the garment owner's evaluated coverage and material.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The source part's local frame and transform remain unchanged.
 * @evidenceExclude contracts/modeling.md#rendered-observation Whole Body and Person consumers observe the material composition.
 * @evidenceExclude contracts/anatomy.md#anatomical-source No anatomical value is added.
 * @evidenceExclude contracts/anatomy.md#permitted-range Final source and model admission retain their domain.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No sculpt input is added.
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
