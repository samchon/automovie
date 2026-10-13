import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";

/**
 * Test whether a point lies in a logical space or any of its child spaces.
 *
 * A storey contains whatever its rooms contain, at any depth. Each space is
 * read through {@link builtSpaceContainsPoint}, so a subtree that states no
 * volume anywhere contains nothing. Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation Collects the space and its descendants by a fixed-point pass over parent links, then answers whether any of them contains the world point through the single per-space reader for cells and shells.
 * @evidence contracts/common.md#clear-and-simple-design Defect: carries private copies of `descendantSpaces` and `requireSpace` instead of using `builtEnvironmentDescendantSpaces`; the per-space containment rule stays in `builtSpaceContainsPoint`.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No tolerance, space kind or spelling is special-cased here, since containment is delegated whole, and an undeclared space id throws rather than answering false.
 * @evidence contracts/common.md#meaningful-documentation States the subtree fold, the delegated per-space rule, that a subtree stating no volume contains nothing, and the refusal.
 * @evidence contracts/performance.md#cost-and-resources Defect: each call costs `O(S D)` for the descendant pass plus one containment test per subtree space, and nothing is cached, so `validateWaterFeatures` (once per grid cell) and `propSpaceContainsBounds` (once per box corner) rebuild the same descendant set for every point.
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
