import { HUMAN_PERSON_SEAM } from "@automovie/human/human/constants/HUMAN_PERSON_SEAM";
import type { IAutoMovieMaterial } from "@automovie/interface";

import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * List linear colour and roughness of the source materials as named numeric
 * appearance inputs. A first colour edit copies the actual source RGB before
 * changing one channel; it supplies no complexion estimate. Removing colour
 * removes the complete optional RGB record, because partial colours are not
 * the document contract. The body's skin colour is derived from the face and
 * is therefore offered only at its face owner. Bounds are renderer domains,
 * and the person builder still refuses an incompatible source or zero cheek.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Offers existing body material finish inputs through the whole-person transaction.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Offers source facial material reflectance and roughness through numeric fields without image resources.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps the body's derived skin colour with its face owner while editing other source materials.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Reads actual source defaults and preserves complete colour records across edits and removal.
 * @author Samchon
 */
export function createConnectedPersonMaterialInputs(
  materials: readonly IAutoMovieMaterial[],
  partition: "face" | "body",
): IConnectedPersonInputDescriptor[] {
  return materials.flatMap((material) => {
    const path = [partition, "materials", material.id];
    const common = {
      group:
        (partition === "face" ? "Face" : "Body") +
        " material · " +
        material.name,
      minimum: 0,
      maximum: 1,
      step: null,
      omission: "the source material's corresponding finish",
      removable: true,
      qualification:
        "Source material renderer domain [0,1], with linear RGB reflectance and independent roughness. This is an authored finish, not a measured physiological range.",
    };
    const colour: IConnectedPersonInputDescriptor[] =
      partition === "body" && material.id === HUMAN_PERSON_SEAM.skinMaterial
        ? []
        : (["r", "g", "b"] as const).map((channel) => ({
            ...common,
            path: [...path, "color", channel],
            label: "linear " + channel.toUpperCase() + " reflectance",
            unit: "linear reflectance",
            ownerDefault: material.baseColor[channel],
            seed: {
              r: material.baseColor.r,
              g: material.baseColor.g,
              b: material.baseColor.b,
            },
            removePath: [...path, "color"],
          }));
    return [
      ...colour,
      {
        ...common,
        path: [...path, "roughness"],
        label: "roughness",
        unit: "dimensionless",
        ownerDefault: material.roughness,
        seed: null,
      },
    ];
  });
}
