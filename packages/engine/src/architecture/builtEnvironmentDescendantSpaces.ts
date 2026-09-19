import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace } from "@automovie/interface";
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
 * The containment fold every other query here performs, exposed once rather
 * than copied. A caller asking what a storey holds, what a building unit owns,
 * or which rooms a derived review population must charge for was otherwise
 * rewriting this walk, and two walks over one hierarchy are two answers that
 * eventually disagree.
 *
 * Sorted, because a population is compared and printed rather than only tested
 * for membership.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentDescendantSpaces` names every logical space under one space. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentDescendantSpaces` resolves the descendant space population the engine folds ownership, topology, and geometry over inside one building-interior boundary.
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
