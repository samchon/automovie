import type { IAutoMovieHumanFaceBasis } from "@automovie/human";
import { HUMAN_FACE_SKIN_APPEARANCE } from "@automovie/human/face/anatomy/skin/HUMAN_FACE_SKIN_APPEARANCE";
import { HUMAN_FACE_SKIN_REGION_APPEARANCE } from "@automovie/human/face/anatomy/skin/HUMAN_FACE_SKIN_REGION_APPEARANCE";
import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * List reflectance of the source's named continuous skin areas. The face
 * owner's registered host and area membership decide the population; missing
 * anatomical names are never guessed. The source owner's identity gain seeds
 * an absent record and changes no albedo until an authored strength is given.
 * No patch centre, radius or personal vertex selection is editable here.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Offers named shared skin-area reflectance and strength as numerical inputs.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Derives selectable areas from registered continuous skin hosts and consumes the face owner's identity and numerical domains.
 * @author Samchon
 */
export function createConnectedPersonSkinAppearanceInputs(basis: IAutoMovieHumanFaceBasis): IConnectedPersonInputDescriptor[] {
  const hosts = new Set([basis.contact?.lips.surface, basis.periocular?.left.cage?.surface,
    basis.periocular?.right.cage?.surface].filter((id): id is string => id !== undefined));
  return Object.entries(basis.skinRegions ?? {}).filter(([, area]) => area.vertices.length > 0 && hosts.has(basis.surfaces[area.surface]?.id))
    .flatMap(([name]) => HUMAN_FACE_SKIN_APPEARANCE.map((trait): IConnectedPersonInputDescriptor => {
      const root = ["face", "skinAppearance", name];
      const value = trait.path.reduce<unknown>((node, key) => typeof node === "object" && node !== null
        ? (node as Record<string, unknown>)[key] : undefined, HUMAN_FACE_SKIN_REGION_APPEARANCE);
      return {
        path: [...root, ...trait.path], group: "Skin reflectance · " + name,
        label: trait.label, unit: trait.unit, minimum: trait.minimum, maximum: trait.maximum,
        minimumExclusive: trait.minimumExclusive, maximumExclusive: trait.maximumExclusive,
        step: null, ownerDefault: typeof value === "number" ? value : null,
        seed: HUMAN_FACE_SKIN_REGION_APPEARANCE, seedPath: root, removePath: root,
        omission: "the source area's unmodified reflectance", removable: true,
        qualification: trait.qualification,
      };
    }));
}
