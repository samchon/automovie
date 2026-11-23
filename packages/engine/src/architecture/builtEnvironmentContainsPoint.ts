import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Test whether a world point lies in a logical space or any of its child
 * spaces.
 *
 * A storey contains whatever its rooms contain, at any depth. Each space of the
 * subtree is read through {@link builtSpaceContainsPoint}, its own stated volume
 * and nothing else, so a subtree that states no volume anywhere contains
 * nothing. Throws for an undeclared space id.
 */
export const builtEnvironmentContainsPoint: (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
  point: IAutoMovieVector3,
) => boolean = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
  point: IAutoMovieVector3,
): boolean => {
  requireBuiltSpace(environment, spaceId);
  const included: Set<string> = builtSpaceSubtree(environment.spaces, spaceId);
  return environment.spaces.some(
    (space: IAutoMovieBuiltSpace): boolean =>
      included.has(space.id) && builtSpaceContainsPoint(space, point),
  );
};
