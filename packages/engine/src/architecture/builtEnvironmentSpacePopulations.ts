import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

/**
 * Report the compact populations standing in a logical space and its
 * descendants.
 *
 * {@link builtEnvironmentSpaceNodes} names them; this hands back the records, so
 * a caller that needs a member's own transform regenerates it from the same set
 * the renderer draws instead of re-deriving a placement law from the geometry.
 * Selection is by declared membership, exactly as an element's is: a population
 * states the one space it occupies and every ancestor of that space folds it in,
 * so nothing here tests a member's position against a cell. That is deliberate.
 * A floor flag rests on the floor plane and an ashlar block sits inside the
 * wall, both of them on or across the boundary a derived test would have to
 * judge them against, so deriving membership would answer "the room is empty" in
 * exactly the cases the room is most full.
 *
 * The records are the environment's own objects in record order. Throws for an
 * undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation Selects populations whose declared `space` falls in the subtree and never tests member positions against cells, since flags and ashlar sit on or across the boundary such a test would judge.
 * @evidence contracts/common.md#clear-and-simple-design Defect: private copies of the subtree walk and the space check; returning the records lets a caller regenerate members from the very set the renderer draws.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Membership is the authored field, not a geometric heuristic, so nothing is excluded for straddling a boundary, and an undeclared space id throws.
 * @evidence contracts/common.md#meaningful-documentation States its relation to the node query, why records rather than ids are returned, why membership is declared, that results are shared objects, and the refusal.
 * @evidence contracts/performance.md#cost-and-resources An `O(S D)` subtree pass and one linear filter over populations, with members never expanded; it returns references to the record's objects and caches nothing.
 * @author Samchon
 */
export const builtEnvironmentSpacePopulations = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltPopulation[] => {
  requireSpace(environment, spaceId);
  const included = descendantSpaces(environment.spaces, spaceId);
  return (environment.populations ?? []).filter((population) =>
    included.has(population.space),
  );
};

const requireSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): void => {
  if (!environment.spaces.some((space) => space.id === spaceId))
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
};

const descendantSpaces = (
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> => {
  const included = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const space of spaces)
      if (
        space.parent !== null &&
        included.has(space.parent) &&
        !included.has(space.id)
      ) {
        included.add(space.id);
        changed = true;
      }
  }
  return included;
};
