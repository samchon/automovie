import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import { HUMAN_FACE_FACIAL_HAIR_TRAITS } from "@automovie/human/face/anatomy/hair/HUMAN_FACE_FACIAL_HAIR_TRAITS";

import type { IConnectedPersonInputDescriptor } from "./IConnectedPersonInputDescriptor";

/**
 * List scalar edits for the document's explicitly authored terminal sites.
 *
 * A zero count or length remains an editable profile. Omitted and null facial
 * hair supply no rows, and no profile, site, seed or registration is inferred.
 * Applying a member writes only its existing document path. Remove deletes the
 * whole optional site because its profile members must be supplied together.
 * Both operations use the catalogue's ordinary person transaction; admission,
 * accepted history, drafts and saving remain with that transaction's owners.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Lists each explicitly authored terminal site's numerical controls, including shaved profiles, without introducing a population.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Copies the profile owner's units and scalar domains into existing person transaction paths; removal addresses the complete optional site.
 * @author Samchon
 */
export function createConnectedPersonFacialHairInputs(
  person: IAutoMovieHumanPersonDocument,
): IConnectedPersonInputDescriptor[] {
  return Object.entries(person.face.facialHair?.sites ?? {}).flatMap(
    ([site, profile]) => {
      if (profile === undefined) return [];
      const root = ["face", "facialHair", "sites", site];
      return HUMAN_FACE_FACIAL_HAIR_TRAITS.map(
        (trait): IConnectedPersonInputDescriptor => ({
          path: [...root, ...trait.path],
          group: "Facial hair · " + site,
          label: trait.label,
          unit: trait.unit,
          minimum: trait.minimum,
          maximum: trait.maximum,
          minimumExclusive: trait.minimumExclusive,
          maximumExclusive: trait.maximumExclusive,
          step: trait.step ?? null,
          ownerDefault: null,
          seed: null,
          removePath: root,
          omission: "no visible terminal layer at this site; biological follicles remain unmeasured",
          removable: true,
          qualification: trait.qualification,
        }),
      );
    },
  );
}
