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
 *
 * @evidence contracts/common.md#principled-implementation Returns the first building whose root space's descendant set, built by a fixed-point pass over parent links, contains the space; validation guarantees exactly one owner, so the first match is the only one.
 * @evidence contracts/common.md#clear-and-simple-design Defect: its private `descendantSpaces` and `requireSpace` duplicate the exported `builtEnvironmentDescendantSpaces` instead of calling it or sharing one helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No default owner is guessed for an unowned space; it throws for the reason validation refuses it, and no building or space id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States why ownership is a real question in a multi-unit work, that a validated record answers it for every space, and both refusals.
 * @evidence contracts/performance.md#cost-and-resources Defect: rebuilds a whole descendant set per building, `O(B S D)` in buildings, spaces and tree depth, where walking the space's own parent chain would be linear; nothing is cached, so envelope faces (once per face) and the drawing schedule (once per space) repeat every walk.
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
