import type { IAutoMovieAffordance } from "@automovie/interface";

import type { AutoMovieArchetype } from "./AutoMovieArchetype";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/** Locate a model contact or report its complete alternatives. */
export function archetypeAffordance(
  model: Pick<AutoMovieArchetype, "id" | "name" | "affordances">,
  id: string,
  archetype: string,
): IAutoMovieAffordance {
  const found: IAutoMovieAffordance | undefined = model.affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  if (found !== undefined) return found;
  throw new AutoMovieArchetypeRefusal({
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
