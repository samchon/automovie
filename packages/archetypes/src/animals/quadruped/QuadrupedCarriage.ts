import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../../core";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { QuadrupedScapula } from "./QuadrupedScapula";
import type { AutoMovieArchetypeQuadruped } from "../AutoMovieArchetypeQuadruped";

/*
 * Explicit rigid carriers for a quadruped's accessories and contacts. Species
 * nod selectors describe optional producer vocabulary: an absent tack selector
 * creates no attachment and does not require an unbuilt accessory.
 */
export namespace QuadrupedCarriage {
  /*
   * Bind every accessory/contact to the declared neck or trunk carrier.
   *
   * The 21 bone parts carry themselves and are excluded from parts. Accessories
   * named by species.nodding follow the common neck nod; every remaining
   * accessory follows trunk. Contacts named by noddingContacts follow neck,
   * while remaining contacts retain trunk carriage, including the current equid
   * held-rein policy. Flexible two-end spans are another owner. Optional
   * producer vocabulary may name absent tack, but duplicate/empty selectors and
   * declarations assigning another bone to neck refuse.
   * Parameter animal: The source parts and original affordances, unchanged.
   * Parameter species: Its declared nod-part/contact selectors and trunk default.
   * Returns: Independent complete accessory-part/contact carrier records; bone
   * parts are intentionally absent from the first record.
   * For missing/sparse arrays, empty/duplicate identities
   * or selectors, a missing bone or a nod selector conflicting with a
   * self-carried bone.
   */
  export function of(
    animal: Pick<AutoMovieArchetype, "parts" | "affordances">,
    species: AutoMovieArchetypeQuadruped.ISpecies,
  ): {
    parts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;
    contacts: Readonly<Record<string, AutoMovieArchetypeQuadrupedBody.Bone>>;
  } {
    const bones: ReadonlySet<string> = new Set<string>([
      "trunk",
      "hindquarters",
      "neck",
      "head",
      "tail",
      ...Object.values(QuadrupedScapula.BONES),
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.flatMap(
        (
          limb: AutoMovieArchetypeQuadrupedBody.Limb,
        ): AutoMovieArchetypeQuadrupedBody.Bone[] => [
          ...AutoMovieArchetypeQuadrupedBody.BONES[limb],
        ],
      ),
    ]);
    const nodding: ReadonlySet<string> = selectors(
      species.nodding,
      "nodding",
      true,
    );
    const noddingContacts: ReadonlySet<string> = selectors(
      species.noddingContacts,
      "noddingContacts",
      false,
    );
    for (const id of nodding)
      if (bones.has(id) && id !== "neck" && id !== "head")
        throw new RangeError(
          `Self-carried quadruped bone ${id} cannot be a neck accessory`,
        );

    const partIds: Set<string> = new Set();
    const contactIds: Set<string> = new Set();
    const parts: Map<string, AutoMovieArchetypeQuadrupedBody.Bone> = new Map();
    const contacts: Map<string, AutoMovieArchetypeQuadrupedBody.Bone> =
      new Map();
    for (let index: number = 0; index < animal.parts.length; index++) {
      const part: IAutoMovieModelPart | undefined = animal.parts[index];
      const id: string = identity(part?.id, `part ${index}`);
      if (partIds.has(id))
        throw new RangeError(`Duplicate quadruped part identity ${id}`);
      partIds.add(id);
      if (!bones.has(id)) parts.set(id, nodding.has(id) ? "neck" : "trunk");
    }
    for (const bone of bones)
      if (!partIds.has(bone))
        throw new RangeError(
          `Quadruped carriage is missing actual bone ${bone}`,
        );

    for (let index: number = 0; index < animal.affordances.length; index++) {
      const contact: IAutoMovieAffordance | undefined =
        animal.affordances[index];
      const id: string = identity(contact?.id, `contact ${index}`);
      if (contactIds.has(id))
        throw new RangeError(`Duplicate quadruped contact identity ${id}`);
      contactIds.add(id);
      contacts.set(id, noddingContacts.has(id) ? "neck" : "trunk");
    }
    return {
      parts: Object.fromEntries(parts),
      contacts: Object.fromEntries(contacts),
    };
  }

  /*
   * A missing identity cannot name an explicit carrier.
   */
  function identity(value: string | undefined, label: string): string {
    if (value === undefined)
      throw new RangeError(`Quadruped ${label} requires an identity`);
    return value;
  }

  /*
   * Optional producer selectors are a vocabulary, not an assertion that tack
   * was built.
   */
  function selectors(
    values: readonly string[] | undefined,
    label: string,
    required: boolean,
  ): ReadonlySet<string> {
    if (values === undefined && !required) return new Set<string>();
    if (values === undefined)
      throw new RangeError(`Quadruped ${label} must be an identity array`);

    const result: Set<string> = new Set();
    for (let index: number = 0; index < values.length; index++) {
      const id: string = identity(values[index], `${label} selector ${index}`);
      if (result.has(id))
        throw new RangeError(`Duplicate quadruped ${label} selector ${id}`);
      result.add(id);
    }
    return result;
  }
}
