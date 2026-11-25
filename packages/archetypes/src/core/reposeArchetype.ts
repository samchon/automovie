import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import type { AutoMovieArchetypeMass } from "./AutoMovieArchetypeMass";
import type { IAutoMovieArchetypeProps } from "./IAutoMovieArchetypeProps";

/**
 * Replace posed parts and, when supplied, every declared contact's frame.
 *
 * @param rest The producer's original contact identities, semantics and rest
 *   mass data.
 * @param parts Independently posed model parts.
 * @param frames Complete contact-frame bindings, or absent to preserve rest
 *   contacts.
 * @returns New props retaining the producer's closed contact id vocabulary.
 * @throws {RangeError} For incomplete or unknown contact-frame bindings.
 */
export function reposeArchetype<
  Id extends string,
  Dimension extends string,
  Physical extends AutoMovieArchetypeMass.IProperties | null,
>(
  rest: IAutoMovieArchetypeProps<Id, Dimension, Physical>,
  parts: IAutoMovieModelPart[],
  frames?: ReadonlyMap<string, IAutoMovieTransform>,
): IAutoMovieArchetypeProps<Id, Dimension, Physical> {
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
  const affordances: IAutoMovieArchetypeProps<Id, Dimension>["affordances"] =
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
