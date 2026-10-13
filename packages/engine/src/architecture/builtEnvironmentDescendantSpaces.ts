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
 * @evidence contracts/common.md#principled-implementation Starts from the root and repeatedly adds every space whose parent is already included until a pass adds nothing, which terminates on any parent graph and is exact on the acyclic one validation guarantees.
 * @evidence contracts/common.md#clear-and-simple-design Defect: private copies of this fixed point remain in `builtEnvironmentBuildingOfSpace`, `builtEnvironmentContainsPoint`, `builtEnvironmentSpaceFidelity`, `builtEnvironmentSpaceNodes`, `builtEnvironmentSpacePopulations`, `builtEnvironmentSpaceSurfaces` and `builtEnvironmentSpaceContentBounds` instead of calling this export.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No space kind stops the fold, a parent cycle cannot hang the loop because a pass that adds nothing ends it, and an undeclared root throws rather than answering itself.
 * @evidence contracts/common.md#meaningful-documentation States that the root is included, why the walk is exported, why the list is sorted and in which order, and the refusal.
 * @evidence contracts/performance.md#cost-and-resources Each pass scans every space and the pass count is the tree depth plus one, so `O(S D)` time plus an `O(n log n)` sort of the result, where a child index built once would make the walk linear; nothing is cached because the record carries no version to invalidate a cache by.
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
