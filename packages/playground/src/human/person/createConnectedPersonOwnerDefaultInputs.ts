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
 * @evidence contracts/common.md#principled-implementation Lid descriptors preserve owner defaults, bounds, measured/derived/authored classification and grounds, while brow/grain metadata uses the actual complete owner record and leaves unpublished per-member bounds absent.
 * @evidence contracts/common.md#clear-and-simple-design The producer transports existing owner metadata/default records while catalogue path preparation and original anatomical/profile admission remain downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authoring envelopes are not clinical ranges, no new brow population is fitted, hidden default record members are preserved by seeding and only the documented optional emergence field is individually removable.
 * @evidence contracts/common.md#meaningful-documentation The comment explains two-field tissue completeness, owner default grounds, missing brow bounds, whole-record seeds and optional emergence removal.
 * @evidence contracts/performance.md#efficient-algorithms Two side passes visit t tissue descriptors, b brow entries and g grain scalars, creating O(t+b+g) fixed-size paths/records plus qualification text; numeric-entry filtering and bounded unit-key comparisons add no geometry traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Existing owner records are borrowed as seeds across their descriptors, while fresh catalogue records avoid sharing mutable UI metadata; no numerical result or earlier catalogue is cached here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The function retains no output and acquires no form/worker/geometry resources; returned descriptors borrow small owner seed records until catalogue refresh/removal/close releases their references.
 *
 * @author Samchon
 */
export function createConnectedPersonOwnerDefaultInputs(): IConnectedPersonInputDescriptor[] {
  const spaced: (name: string) => string = (name: string): string =>
    name.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase();
  const sides: readonly ["left", "right"] = ["left", "right"];
  const tissues: IConnectedPersonInputDescriptor[] = sides.flatMap((side: "left" | "right"): IConnectedPersonInputDescriptor[] =>
    HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS.flatMap((tissue: (typeof HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS)[number]): IConnectedPersonInputDescriptor[] => {
      const seed: { inwardOffsetMm: number; thicknessMm: number } = {
        inwardOffsetMm: tissue.inwardOffset.defaultMm,
        thicknessMm: tissue.thickness.defaultMm,
      };
      return (
        [
          [
            "inwardOffsetMm",
            "inward offset from the lid skin",
            tissue.inwardOffset,
          ],
          ["thicknessMm", "thickness", tissue.thickness],
        ] as const
      ).map(
        ([member, label, scalar]: readonly [string, string, (typeof HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS)[number]["inwardOffset"]]): IConnectedPersonInputDescriptor => ({
          path: ["face", "periocularTissues", side, tissue.tissue, member],
          group: "Lid tissue shells · " + side,
          label: spaced(tissue.tissue) + " " + label,
          unit: "mm",
          minimum: scalar.minimumMm,
          maximum: scalar.maximumMm,
          step: null,
          ownerDefault: scalar.defaultMm,
          seed,
          omission:
            "an omitted whole tissue subtree uses registered-eye defaults; an explicit subtree emits only its stated tissue members",
          removable: false,
          qualification:
            scalar.kind +
            ": " +
            scalar.ground +
            " An authoring envelope, not a clinical range.",
        }),
      );
    }),
  );
  const brows: IConnectedPersonInputDescriptor[] = sides.flatMap((side: "left" | "right"): IConnectedPersonInputDescriptor[] =>
    Object.entries(HUMAN_FACE_BROW_POPULATION).flatMap(
      ([member, value]: [string, (typeof HUMAN_FACE_BROW_POPULATION)[keyof typeof HUMAN_FACE_BROW_POPULATION]]): IConnectedPersonInputDescriptor[] =>
        typeof value !== "number" ||
        member === "segments" ||
        member === "densitySeed"
          ? []
          : [
              {
                path: ["face", "brows", side, member],
                group: "Brow shafts · " + side,
                label: spaced(member),
                unit:
                  member === "strandCount"
                    ? "count"
                    : member.endsWith("Degrees")
                      ? "degrees"
                      : [
                            "taper",
                            "rootLower",
                            "rootUpper",
                            "medialFade",
                            "lateralFade",
                          ].includes(member)
                        ? "fraction"
                        : "mm",
                minimum: null,
                maximum: null,
                step: member === "strandCount" ? 1 : null,
                ownerDefault: value,
                seed: HUMAN_FACE_BROW_POPULATION,
                omission:
                  "whole-section omission uses registered-band owner populations; explicit sparse sections retain source cards for omitted sides",
                removable: member === "emergenceDegrees",
                qualification:
                  "The face owner's default brow population; the owner publishes no envelope per member, and its profile check admits the value.",
              },
            ],
    ),
  );
  const grain: IConnectedPersonInputDescriptor[] = sides.flatMap((side: "left" | "right"): IConnectedPersonInputDescriptor[] =>
    Object.entries(HUMAN_FACE_BROW_POPULATION.grain ?? {}).map(
      ([member, value]: [string, NonNullable<(typeof HUMAN_FACE_BROW_POPULATION)["grain"]>[keyof NonNullable<(typeof HUMAN_FACE_BROW_POPULATION)["grain"]>]]): IConnectedPersonInputDescriptor => ({
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
        omission:
          "whole-section omission uses registered-band owner populations; explicit sparse sections retain source cards for omitted sides",
        removable: false,
        qualification:
          "Named grain scalar from the face owner's authored default. No measured population envelope is supplied; the original profile admission decides support.",
      }),
    ),
  );
  return [...tissues, ...brows, ...grain];
}
