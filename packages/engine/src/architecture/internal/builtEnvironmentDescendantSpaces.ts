import { IAutoMovieBuiltEnvironment } from "@automovie/interface";

import { compareRenderIds } from "../../render/internal/compareRenderIds";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/*
 * Every logical space under one space, including that space itself.
 *
 * The containment fold the space queries perform, published so a caller asking
 * what a storey holds, what a building unit owns, or which rooms a derived
 * review population must charge for uses this walk instead of rewriting it,
 * because two walks over one hierarchy are two answers that eventually
 * disagree.
 *
 * Membership follows `parent` links at any depth. Sorted in code-unit order,
 * because a population is compared and printed rather than only tested for
 * membership. Throws for an undeclared space id.
 */
export function builtEnvironmentDescendantSpaces(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): string[] {
  requireBuiltSpace(environment, spaceId);
  return [...builtSpaceSubtree(environment.spaces, spaceId)].sort(
    compareRenderIds,
  );
}
