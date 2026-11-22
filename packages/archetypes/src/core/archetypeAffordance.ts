import type { IAutoMovieAffordance } from "@automovie/interface";

import type { Archetype } from "./Archetype";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * Locate a model contact or report its complete alternatives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Uses the producer identity, model display name and current contact list in the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Searches the supplied contact list for the exact id.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup followed by the missing-contact refusal.
 * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No fallback contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms One scan through the model contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Has no repeated computation on successful lookup.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The lookup retains nothing.
 */
export function archetypeAffordance(
  model: Pick<Archetype, "id" | "name" | "affordances">,
  id: string,
  archetype: string,
): IAutoMovieAffordance {
  const found: IAutoMovieAffordance | undefined = model.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  if (found !== undefined) return found;
  throw new ArchetypeRefusal({
    kind: "affordance",
    archetype,
    axis: "affordance",
    value: id,
    feasible: {
      kind: "alternatives",
      values: model.affordances.map((a: IAutoMovieAffordance): string => a.id),
    },
    reason: `${model.name ?? model.id} has no affordance "${id}"`,
    fix: "name one of the affordances this archetype declares",
  });
}
