import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
} from "@automovie/interface";

import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Name what is staged in a logical space and its descendants.
 *
 * This is the join that keeps the visible model and the semantic partition from
 * drifting apart: a room can be asked what is visibly inside it without a
 * second traversal that could answer differently.
 *
 * Two spellings come back, in this order, because two things are staged. An
 * element contributes exactly the `node` id {@link lowerBuiltEnvironment} emits
 * for it, `<environment>/<element>`. A population contributes
 * `instance-set:<set>`, the one owner id the render inventory and the semantic
 * mask already address a whole population by, because lowering emits it as one
 * compact set and not as `count` nodes. Naming the population rather than its
 * members is the difference between an answer and an unbounded expansion: one
 * authored field of roof slate is 2,392 members, and a query a reviewer calls
 * in a loop may not hand back 2,392 strings to say "there is slate here".
 * {@link builtEnvironmentSpacePopulations} hands back the sets themselves for a
 * caller that wants the placement law. Regeneration names a procedural member
 * `instance:<set>:slot:<six-digit-index>` and an explicit member
 * `instance:<set>:<transform-id>`, exactly as the production materializer
 * does.
 *
 * Membership is the authored `space` field folded through the space tree.
 * Transform-only elements are left out because they draw nothing. Each group
 * keeps record order. Throws an `Error` for an undeclared space id.
 *
 * @param environment Building record to read.
 * @param spaceId Logical space whose staged contents are named.
 * @returns Element node ids, then population owner ids.
 */
export const builtEnvironmentSpaceNodes: (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
) => string[] = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] => {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  return [
    ...environment.elements
      .filter(
        (element: IAutoMovieBuiltElement): boolean =>
          element.model !== null &&
          element.space !== null &&
          included.has(element.space),
      )
      .map(
        (element: IAutoMovieBuiltElement): string =>
          `${environment.id}/${element.id}`,
      ),
    ...(environment.populations ?? [])
      .filter((population: IAutoMovieBuiltPopulation): boolean =>
        included.has(population.space),
      )
      .map(
        (population: IAutoMovieBuiltPopulation): string =>
          `instance-set:${population.set.id}`,
      ),
  ];
};
