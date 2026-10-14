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
 * @evidence contracts/common.md#principled-implementation Actual source RGB seeds the complete colour record and material roughness supplies its own default, while the derived body skin colour stays edited through the face owner.
 * @evidence contracts/common.md#clear-and-simple-design Descriptor generation separates renderer-domain metadata from source material validation, document path copying and complete-person admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Linear finish bounds are not physiological ranges, initial colour edits preserve untouched source components and optional colour removal removes the whole record.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies linear RGB/source seed provenance, independent roughness, whole-colour removal and derived skin-colour ownership.
 * @evidence contracts/performance.md#efficient-algorithms One material pass creates at most four fixed-size descriptors per material, O(m) time/output storage plus material/path label characters; seam-skin exclusion is a constant identity comparison and no geometry/texture payload is read.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each catalogue receives independent descriptor/path/seed records for its source material state; this cheap linear metadata producer retains no previous output or numerical cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Produced metadata contains copied RGB scalars and source finish values, not renderer allocations; no result is retained after return and catalogue lifetime owns descriptor reachability.
 *
 * @author Samchon
 */
export function createConnectedPersonMaterialInputs(
  materials: readonly IAutoMovieMaterial[],
  partition: "face" | "body",
): IConnectedPersonInputDescriptor[] {
  return materials.flatMap(
    (material: IAutoMovieMaterial): IConnectedPersonInputDescriptor[] => {
      const path: string[] = [partition, "materials", material.id];
      const common: Omit<
        IConnectedPersonInputDescriptor,
        "path" | "label" | "unit" | "ownerDefault" | "seed"
      > = {
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
          : (["r", "g", "b"] as const).map(
              (channel: "r" | "g" | "b"): IConnectedPersonInputDescriptor => ({
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
              }),
            );
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
    },
  );
}
