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
 * @evidence contracts/common.md#principled-implementation Only explicit existing facial terminal sites receive descriptors copied from the profile owner's bounds/units/qualification, preserving zero-count or zero-length authored profiles and whole-site removal.
 * @evidence contracts/common.md#clear-and-simple-design Metadata generation remains separate from profile completeness, source registration, geometric allocation and the catalogue's person transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/null populations produce no guessed site, profile or seed, and rendering shaft domains do not establish biological follicle density or measurements.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies explicit-site provenance, zero/omission semantics, whole-record removal and existing admission/history owners.
 * @evidence contracts/performance.md#efficient-algorithms One site-entry traversal emits t profile descriptors per supplied site, O(st) small records/paths plus copied label/path text for s sites and fixed owner table t; no terminal geometry or follicle data are generated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Current explicit populations determine this catalogue, so fresh descriptors preserve current sparse paths; no prior output or numerical result is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The producer retains no descriptors after return and acquires no geometry/worker resources; the mounted catalogue owns ordinary metadata until refresh/removal/close.
 *
 * @author Samchon
 */
export function createConnectedPersonFacialHairInputs(
  person: IAutoMovieHumanPersonDocument,
): IConnectedPersonInputDescriptor[] {
  return Object.entries(person.face.facialHair?.sites ?? {}).flatMap(
    ([site, profile]: [
      string,
      NonNullable<
        IAutoMovieHumanPersonDocument["face"]["facialHair"]
      >["sites"][keyof NonNullable<
        IAutoMovieHumanPersonDocument["face"]["facialHair"]
      >["sites"]],
    ]): IConnectedPersonInputDescriptor[] => {
      if (profile === undefined) return [];
      const root: string[] = ["face", "facialHair", "sites", site];
      return HUMAN_FACE_FACIAL_HAIR_TRAITS.map(
        (
          trait: (typeof HUMAN_FACE_FACIAL_HAIR_TRAITS)[number],
        ): IConnectedPersonInputDescriptor => ({
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
          omission:
            "no visible terminal layer at this site; biological follicles remain unmeasured",
          removable: true,
          qualification: trait.qualification,
        }),
      );
    },
  );
}
