import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltPopulation, IAutoMovieBuiltSpace } from "@automovie/interface";

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
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group `builtEnvironmentSpacePopulations` answers which compact populations a space owns, which is the space membership this requirement holds apart from a member's logical groups.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-compression-individuality `builtEnvironmentSpacePopulations` exposes the compact source record needed to regenerate and inspect individual members without storing a member-sized answer.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality `builtEnvironmentSpacePopulations` keeps a compressed population selectable and inspectable through the space that owns it.
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
