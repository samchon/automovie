import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanPersonDocument,
} from "@automovie/human";
import { HUMAN_FACE_HAIR_TRAITS } from "@automovie/human/face/anatomy/hair/HUMAN_FACE_HAIR_TRAITS";
import { expandHumanFaceScalpHair } from "@automovie/human/face/anatomy/hair/expandHumanFaceScalpHair";
import { readHumanFaceHairTraits } from "@automovie/human/face/anatomy/hair/readHumanFaceHairTraits";

import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * List sparse named styling over the document's actual existing populations.
 * The face owner supplies every unit, closed choice, open bound and exact
 * legacy-to-trait reading. Editing one member starts a complete containing
 * record from that reading, preserving unedited styling and numerical policy.
 * Unsupported legacy directions have no invented closed-choice default.
 * Absent operations can be entered as a complete group without guessed values.
 *
 * @evidence contracts/common.md#principled-implementation Existing legacy or named-scalp populations are read through their actual Human owner, and sparse trait descriptors preserve source units, open bounds, closed choices, exact current values and complete containing-record seeds.
 * @evidence contracts/common.md#clear-and-simple-design Human expansion/trait reading owns source compatibility and conversions, this function transports descriptors and the catalogue transaction owns authored edits and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported legacy comb/part directions receive no rounded closed-choice defaults, absent populations are not inferred and operation removal is distinct from explicit null disabling.
 * @evidence contracts/common.md#meaningful-documentation The comment states existing-population provenance, exact trait reading, unedited compatibility preservation and absent-operation group editing.
 * @evidence contracts/performance.md#efficient-algorithms For l layers and t owner traits, metadata work is O(ltp) for path length p plus output text/records; actual Human scalp expansion and trait reading additionally perform source surface/domain lookups per layer, document validation and finish copying. No shaft tessellation occurs here, and only one trait reading per layer feeds all its descriptors.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One current layer reading is reused across its traits, but cross-call catalogue caching is not implemented because document populations, basis compatibility and legacy values can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary expanded documents/read traits leave with the call; returned seeds borrow those ordinary containing records while the catalogue retains descriptors, with no worker, shader or geometry allocation acquired by this producer.
 *
 * @author Samchon
 */
export function createConnectedPersonHairInputs(
  basis: IAutoMovieHumanFaceBasis,
  person: IAutoMovieHumanPersonDocument,
): IConnectedPersonInputDescriptor[] {
  const at: (value: unknown, path: readonly string[]) => unknown = (value: unknown, path: readonly string[]): unknown =>
    path.reduce<unknown>(
      (node: unknown, key: string): unknown =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[key]
          : undefined,
      value,
    );
  const hair: IAutoMovieHumanPersonDocument["face"]["hair"] =
    person.face.scalpHair === undefined
      ? person.face.hair
      : expandHumanFaceScalpHair(basis, person.face.scalpHair);
  return (hair?.layers ?? []).flatMap((layer: NonNullable<IAutoMovieHumanPersonDocument["face"]["hair"]>["layers"][number]): IConnectedPersonInputDescriptor[] => {
    const original: ReturnType<typeof readHumanFaceHairTraits> = readHumanFaceHairTraits(basis, layer);
    const root: string[] = ["face", "hairTraits", layer.id];
    return HUMAN_FACE_HAIR_TRAITS.map(
      (trait: (typeof HUMAN_FACE_HAIR_TRAITS)[number]): IConnectedPersonInputDescriptor => {
        const current: unknown = at(original, trait.path);
        const record: unknown = at(original, trait.path.slice(0, 1));
        const seed: object | null =
          typeof record === "object" && record !== null ? record : null;
        const operation: string[] | undefined = ["part", "gather"].includes(trait.path[0])
          ? [...root, trait.path[0]]
          : trait.path[0] === "fallHoldMm"
            ? [...root, "fallHoldMm"]
            : undefined;
        return {
          path: [...root, ...trait.path],
          group: "Hair · " + layer.id + " · " + trait.path[0],
          label: trait.label,
          unit: trait.unit,
          minimum: trait.minimum,
          maximum: trait.maximum,
          minimumExclusive: trait.minimumExclusive,
          maximumExclusive: trait.maximumExclusive,
          choices: trait.choices,
          ownerChoice: typeof current === "string" ? current : undefined,
          step: null,
          ownerDefault: typeof current === "number" ? current : null,
          seed,
          seedPath: [...root, trait.path[0]],
          removePath:
            trait.path.length > 1 ? [...root, trait.path[0]] : undefined,
          disablePath: operation,
          omission:
            "the underlying population's exact original trait; no new hairstyle is selected",
          removable: true,
          qualification:
            trait.qualification +
            (trait.dependentRule === undefined
              ? ""
              : " " + trait.dependentRule),
        };
      },
    );
  });
}
