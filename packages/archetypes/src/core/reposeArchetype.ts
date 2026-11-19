import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import type { ArchetypeMass } from "./ArchetypeMass";
import type { IArchetypeProps } from "./IArchetypeProps";

/**
 * Replace posed parts and, when supplied, every declared contact's frame.
 *
 * @param rest The producer's original contact identities, semantics and rest mass data.
 * @param parts Actual independently posed model parts.
 * @param frames Complete contact-frame bindings, or absent to preserve rest contacts.
 * @returns New props retaining the producer's closed contact id vocabulary.
 * @throws {RangeError} For incomplete or unknown contact-frame bindings.
 * @evidence contracts/development/common.md#meaningful-documentation States complete frame admission, preserved identities and semantics, optional rest behavior and refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid pose changes contact frames, not their producer-declared identities or physical semantics. Mapping the original typed declarations preserves their exact Id union rather than casting arbitrary replacement contacts into it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit a complete one-to-one frame map, replace only each declared contact's frame and copy the props with posed parts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No type assertion, widened contact vocabulary, silently omitted contact or invented identity bypasses the original producer contract.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(A) map lookups and independent contact records for A contacts; omitted frame data reuses the original list.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Rest contact metadata and immutable geometry/material/mass data remain owned by the original producer; only changed contact records and the props record are rebuilt.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent props/contact records, retains no frame map or query cache and acquires no external resource.
 */
export function reposeArchetype<
  Id extends string,
  Dimension extends string,
  Physical extends ArchetypeMass.IProperties | null,
>(
  rest: IArchetypeProps<Id, Dimension, Physical>,
  parts: IAutoMovieModelPart[],
  frames?: ReadonlyMap<string, IAutoMovieTransform>,
): IArchetypeProps<Id, Dimension, Physical> {
  if (
    frames !== undefined &&
    (frames.size !== rest.affordances.length ||
      rest.affordances.some(
        (contact: IAutoMovieAffordance): boolean => !frames.has(contact.id),
      ))
  )
    throw new RangeError(
      "A reposed contact frame map must bind every declared contact exactly once",
    );
  const affordances: IArchetypeProps<Id, Dimension>["affordances"] =
    frames === undefined
      ? rest.affordances
      : rest.affordances.map(
          (
            contact: IAutoMovieAffordance & { id: Id },
          ): IAutoMovieAffordance & { id: Id } => ({
            ...contact,
            frame: frames.get(contact.id)!,
          }),
        );
  return { ...rest, parts, affordances };
}
