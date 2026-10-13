import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

/**
 * Name the building unit that owns a logical space.
 *
 * A work holds several independently placed building units, so "which building
 * is this room in" is a real question rather than a constant. A validated
 * environment answers it for every space; an unowned space is refused here for
 * the same reason validation refuses it.
 *
 * Throws for an undeclared space id and for a space no building unit owns.
 */
export const builtEnvironmentBuildingOfSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string => {
  requireSpace(environment, spaceId);
  const owner = environment.buildings.find((building) =>
    descendantSpaces(environment.spaces, building.space).has(spaceId),
  );
  if (owner === undefined)
    throw new Error(
      `built environment "${environment.id}" has no building unit owning logical space "${spaceId}"`,
    );
  return owner.id;
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
