import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../AutoMovieArchetypeFrame";
import type { AutoMovieArchetypeMass } from "../AutoMovieArchetypeMass";
import type { IAutoMovieArchetypeProps } from "../IAutoMovieArchetypeProps";

/**
 * Replace posed parts and, when supplied, every declared contact's frame.
 *
 * @param rest The producer's original contact identities, semantics and rest
 *   mass data.
 * @param parts Independently posed model parts.
 * @param frames Complete contact-frame bindings, or absent to preserve rest
 *   contacts without a material owner. A material site follows its posed part.
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
    frames !== undefined
      ? rest.affordances.map(
          (
            contact: IAutoMovieAffordance & { id: Id },
          ): IAutoMovieAffordance & { id: Id } => ({
            ...contact,
            frame: frames.get(contact.id)!,
          }),
        )
      : materialSites(rest, parts);
  return { ...rest, parts, affordances };
}

/** Derive undeclared contact updates by the same rigid motion as their part. */
function materialSites<I extends string, D extends string>(
  rest: Pick<IAutoMovieArchetypeProps<I, D>, "parts" | "affordances">,
  posed: readonly IAutoMovieModelPart[],
): IAutoMovieArchetypeProps<I, D>["affordances"] {
  if (
    !rest.affordances.some(
      (a: IAutoMovieAffordance): boolean => a.materialPart !== undefined,
    )
  )
    return rest.affordances;
  const before: Map<string, IAutoMovieModelPart> = new Map();
  const after: Map<string, IAutoMovieModelPart> = new Map();
  for (const part of rest.parts) before.set(part.id, part);
  for (const part of posed) after.set(part.id, part);
  return rest.affordances.map(
    (a: IAutoMovieAffordance<I>): IAutoMovieAffordance<I> => {
      if (a.materialPart === undefined) return a;
      const source: IAutoMovieModelPart | undefined = before.get(
        a.materialPart,
      );
      const destination: IAutoMovieModelPart | undefined = after.get(
        a.materialPart,
      );
      if (source === undefined || destination === undefined)
        throw new RangeError(
          `Material site ${a.id} requires part ${a.materialPart} in both poses`,
        );
      const from: IAutoMovieTransform = source.transform ?? IDENTITY;
      const to: IAutoMovieTransform = destination.transform ?? IDENTITY;
      const rotation: IAutoMovieTransform["rotation"] = Quaternion.multiply(
        to.rotation,
        Quaternion.inverse(from.rotation),
      );
      return {
        ...a,
        frame: AutoMovieArchetypeFrame.move(
          {
            rotation,
            translation: Vector3.subtract(
              to.translation,
              Quaternion.rotateVector(rotation, from.translation),
            ),
          },
          a.frame,
        ),
      };
    },
  );
}

/** Model origin for geometry with no explicit part transform. */
const IDENTITY: IAutoMovieTransform = AutoMovieArchetypeFrame.upright({
  x: 0,
  y: 0,
  z: 0,
});
