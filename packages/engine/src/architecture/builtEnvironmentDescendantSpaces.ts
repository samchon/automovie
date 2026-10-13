import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

import { compareAutoMovieRenderIds } from "../render/compareAutoMovieRenderIds";

const requireSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): void => {
  if (!environment.spaces.some((space) => space.id === spaceId))
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
};

/**
 * Every logical space under one space, including that space itself.
 *
 * The containment fold the space queries here perform, exported so a caller
 * asking what a storey holds, what a building unit owns, or which rooms a
 * derived review population must charge for uses this walk instead of
 * rewriting it, because two walks over one hierarchy are two answers that
 * eventually disagree.
 *
 * Sorted in code-unit order, because a population is compared and printed
 * rather than only tested for membership. Throws for an undeclared space id.
 *
 * @author Samchon
 */
export const builtEnvironmentDescendantSpaces = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] => {
  requireSpace(environment, spaceId);
  return [...descendantSpaces(environment.spaces, spaceId)].sort(
    compareAutoMovieRenderIds,
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
