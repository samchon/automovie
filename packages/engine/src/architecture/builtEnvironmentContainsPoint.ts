import { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace, IAutoMovieVector3 } from "@automovie/interface";
import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";

/**
 * Test whether a point lies in a logical space or any of its child spaces.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `builtEnvironmentContainsPoint` tests whether a point lies in a logical space or any of its child spaces. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `builtEnvironmentContainsPoint` tests the requested logical space and its descendant spaces until one declared volume contains the point.
 */
export const builtEnvironmentContainsPoint = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
  point: IAutoMovieVector3,
): boolean => {
  requireSpace(environment, spaceId);
  const included = descendantSpaces(environment.spaces, spaceId);
  return environment.spaces.some(
    (space) => included.has(space.id) && builtSpaceContainsPoint(space, point),
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
