import { HUMAN_FACE_BROW_POPULATION } from "@automovie/human/face/anatomy/brow/HUMAN_FACE_BROW_POPULATION";
import { HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS } from "@automovie/human/face/anatomy/eye/HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS";

import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * List the catalogue inputs whose owners publish a default record: the lid
 * tissue shells and the brow shaft populations of each eye.
 *
 * A lid tissue's two dimensions come from the face owner's tissue
 * descriptors: default, authoring envelope, and the ground of each value,
 * prefixed with whether a read source measured it, it was derived, or it is
 * authored. Editing one dimension of an absent tissue starts that tissue from
 * the owner's default pair, because a tissue section needs both.
 *
 * A brow population comes from the face owner's default population. The
 * owner publishes a default record and no envelope per member, so every brow
 * member is listed with "range not supplied" and the owner's default value,
 * and admission stays with the brow profile's own check. Editing one member
 * of an absent side starts that side from the owner's whole default
 * population, including the members this list does not show (its flow and
 * root band). The emergence angle is the profile's optional member and may be
 * removed alone; the others belong to the record.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Lists lid tissue and brow inputs from the face owner's published defaults and envelopes.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Starts an absent tissue or brow side from its owner's default record instead of a value of the editor's own.
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Carries the document path the one person transaction edits for each of these inputs.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor States the owner's ground beside each value without restating it as the editor's claim.
 * @author Samchon
 */
export function createConnectedPersonOwnerDefaultInputs(): IConnectedPersonInputDescriptor[] {
  const spaced = (name: string): string => name.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase();
  const sides = ["left", "right"] as const;
  const tissues = sides.flatMap((side) =>
    HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS.flatMap((tissue) => {
      const seed = { inwardOffsetMm: tissue.inwardOffset.defaultMm, thicknessMm: tissue.thickness.defaultMm };
      return ([
        ["inwardOffsetMm", "inward offset from the lid skin", tissue.inwardOffset],
        ["thicknessMm", "thickness", tissue.thickness],
      ] as const).map(([member, label, scalar]): IConnectedPersonInputDescriptor => ({
        path: ["face", "periocularTissues", side, tissue.tissue, member],
        group: "Lid tissue shells · " + side,
        label: spaced(tissue.tissue) + " " + label,
        unit: "mm",
        minimum: scalar.minimumMm,
        maximum: scalar.maximumMm,
        step: null,
        ownerDefault: scalar.defaultMm,
        seed,
        omission: "an omitted whole tissue subtree uses registered-eye defaults; an explicit subtree emits only its stated tissue members",
        removable: false,
        qualification: scalar.kind + ": " + scalar.ground + " An authoring envelope, not a clinical range.",
      }));
    }),
  );
  const brows = sides.flatMap((side) =>
    Object.entries(HUMAN_FACE_BROW_POPULATION).flatMap(([member, value]): IConnectedPersonInputDescriptor[] =>
      typeof value !== "number" || member === "segments" || member === "densitySeed"
        ? []
        : [
            {
              path: ["face", "brows", side, member],
              group: "Brow shafts · " + side,
              label: spaced(member),
              unit: member === "strandCount" ? "count"
                : member.endsWith("Degrees") ? "degrees"
                    : ["taper", "rootLower", "rootUpper", "medialFade", "lateralFade"].includes(member) ? "fraction" : "mm",
              minimum: null,
              maximum: null,
              step: member === "strandCount" ? 1 : null,
              ownerDefault: value,
              seed: HUMAN_FACE_BROW_POPULATION,
              omission: "whole-section omission uses registered-band owner populations; explicit sparse sections retain source cards for omitted sides",
              removable: member === "emergenceDegrees",
              qualification: "The face owner's default brow population; the owner publishes no envelope per member, and its profile check admits the value.",
            },
          ],
    ),
  );
  const grain = sides.flatMap((side) =>
    Object.entries(HUMAN_FACE_BROW_POPULATION.grain ?? {}).map(([member, value]): IConnectedPersonInputDescriptor => ({
      path: ["face", "brows", side, "grain", member],
      group: "Brow grain · " + side,
      label: spaced(member),
      unit: member.endsWith("Mm") ? "mm" : "dimensionless",
      minimum: null,
      maximum: null,
      step: null,
      ownerDefault: value,
      seed: HUMAN_FACE_BROW_POPULATION,
      seedPath: ["face", "brows", side],
      omission: "whole-section omission uses registered-band owner populations; explicit sparse sections retain source cards for omitted sides",
      removable: false,
      qualification: "Named grain scalar from the face owner's authored default. No measured population envelope is supplied; the original profile admission decides support.",
    })),
  );
  return [...tissues, ...brows, ...grain];
}
