import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
} from "@automovie/interface";

import type { Archetype } from "../core";
import { QuadrupedBody } from "./QuadrupedBody";
import type { createQuadruped } from "./createQuadruped";

/**
 * Explicit rigid carriers for an actual quadruped's accessories and contacts.
 * Species nod selectors describe optional producer vocabulary: an absent tack
 * selector creates no attachment and does not require an unbuilt accessory.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual accessory/contact ownership, optional nod-selector vocabulary, neck/trunk policy, bone exclusion and identity/selector refusals.
 * @evidence contracts/development/design.md#principled-representation Each actual non-bone part and affordance has one named carrier from the shared closed bone vocabulary, derived only from the species' declared nod selectors and its explicit trunk default.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shared ride passes these two complete records to QuadrupedPose; source producers retain geometry/contact identities and QuadrupedSkeleton owns rigid emission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No nearest-bone geometry, coordinate threshold, species case, contact-name heuristic or fixture-specific attachment substitutes for the declared policy.
 */
export namespace QuadrupedCarriage {
  /**
   * Bind every actual accessory/contact to the declared neck or trunk carrier.
   *
   * The 21 actual bone parts carry themselves and are excluded from parts.
   * Accessories named by species.nodding follow the common neck nod; every
   * remaining accessory follows trunk. Contacts named by noddingContacts
   * follow neck, while remaining contacts retain trunk carriage, including the
   * current equid held-rein policy. Flexible two-end spans are another owner.
   * Optional producer vocabulary may name absent tack, but duplicate/empty
   * selectors and declarations assigning another actual bone to neck refuse.
   *
   * @param animal The actual source parts and original affordances, unchanged.
   * @param species Its declared nod-part/contact selectors and trunk default.
   * @returns Independent complete accessory-part/contact carrier records; bone parts are intentionally absent from the first record.
   * @throws {RangeError} For missing/sparse arrays, empty/duplicate identities or selectors, a missing actual bone or a nod selector conflicting with a self-carried bone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines complete actual records, the shared bone exclusion, neck/trunk defaults, optional absent tack selectors, legacy equid contact carriage and explicit refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Admit actual identities and the complete closed bone vocabulary, then bind each existing non-bone part and contact according to its declared nod-selector membership. Bone parts remain owned by their actual FK frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build the shared bone set, admit selectors/source identities, verify all actual bones and emit the two independent carrier records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No coordinate or nearest-bone inference, species branch, silently ignored duplicate, invented absent accessory or assumed rein-to-head binding changes the producer's declared policy.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+P+A+N) work and storage for bones, actual parts/affordances and nod selectors; sets/maps avoid repeated scans and geometry is neither inspected nor copied.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared QuadrupedBody.LIMBS/BONES supply the closed actual vocabulary; admitted selector sets serve every binding and the same records feed the existing pose owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All sets/maps are call-local. Returned O(P+A) string records own their entries and retain no model, geometry, source arrays, process or external handle.
   */
  export function of(
    animal: Pick<Archetype, "parts" | "affordances">,
    species: createQuadruped.ISpecies,
  ): {
    parts: Readonly<Record<string, QuadrupedBody.Bone>>;
    contacts: Readonly<Record<string, QuadrupedBody.Bone>>;
  } {
    if (!Array.isArray(animal.parts) || !Array.isArray(animal.affordances))
      throw new RangeError(
        "Quadruped carriage requires actual part and contact arrays",
      );

    const bones: ReadonlySet<string> = new Set<string>([
      "trunk",
      "hindquarters",
      "neck",
      "head",
      "tail",
      ...QuadrupedBody.LIMBS.flatMap(
        (limb: QuadrupedBody.Limb): QuadrupedBody.Bone[] => [
          ...QuadrupedBody.BONES[limb],
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
    const parts: Map<string, QuadrupedBody.Bone> = new Map();
    const contacts: Map<string, QuadrupedBody.Bone> = new Map();
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

  /** A missing or empty identity cannot name an explicit actual carrier. */
  function identity(value: string | undefined, label: string): string {
    if (typeof value !== "string" || value.trim().length === 0)
      throw new RangeError(`Quadruped ${label} requires a nonempty identity`);
    return value;
  }

  /** Optional producer selectors are a vocabulary, not an assertion that tack was built. */
  function selectors(
    values: readonly string[] | undefined,
    label: string,
    required: boolean,
  ): ReadonlySet<string> {
    if (values === undefined && !required) return new Set<string>();
    if (!Array.isArray(values))
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
