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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes named scalp lengths and styling choices without source coordinates, planes or guide controls.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Consumes owner metadata and current trait readings, preserving every unedited legacy population field through sparse overlays.
 * @author Samchon
 */
export function createConnectedPersonHairInputs(
  basis: IAutoMovieHumanFaceBasis,
  person: IAutoMovieHumanPersonDocument,
): IConnectedPersonInputDescriptor[] {
  const at = (value: unknown, path: readonly string[]): unknown =>
    path.reduce<unknown>(
      (node, key) =>
        typeof node === "object" && node !== null
          ? (node as Record<string, unknown>)[key]
          : undefined,
      value,
    );
  const hair =
    person.face.scalpHair === undefined
      ? person.face.hair
      : expandHumanFaceScalpHair(basis, person.face.scalpHair);
  return (hair?.layers ?? []).flatMap((layer) => {
    const original = readHumanFaceHairTraits(basis, layer);
    const root = ["face", "hairTraits", layer.id];
    return HUMAN_FACE_HAIR_TRAITS.map(
      (trait): IConnectedPersonInputDescriptor => {
        const current = at(original, trait.path);
        const record = at(original, trait.path.slice(0, 1));
        const seed =
          typeof record === "object" && record !== null ? record : null;
        const operation = ["part", "gather"].includes(trait.path[0])
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
