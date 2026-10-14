import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtSpaceContainsPoint } from "./builtSpaceContainsPoint";
import { builtSpaceSubtree } from "./builtSpaceSubtree";
import { requireBuiltSpace } from "./requireBuiltSpace";

/**
 * Test whether a world point lies in a logical space or any of its child spaces.
 *
 * A storey contains whatever its rooms contain, at any depth. Each space of the subtree is read through {@link builtSpaceContainsPoint}, its own stated volume and nothing else, so a subtree that states no volume anywhere contains nothing. Throws for an undeclared space id.
 *
 * @evidence contracts/common.md#principled-implementation Containment in a union is containment in any member, so the answer is an existential test of the single-space predicate over the subtree the shared walk returns, stopping at the first space that holds the point.
 * @evidence contracts/common.md#clear-and-simple-design Composes the shared subtree walk, the per-space predicate and the shared id refusal, so this query owns only the fold over descendants.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space or caller; a subtree stating no volume contains nothing by the per-space rule rather than by a special case here.
 * @evidence contracts/common.md#meaningful-documentation States the world point, the descendant fold at any depth, that each space answers from its own stated volume, the empty answer for an unstated subtree, and the throw.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the space count for the walk and scan, plus the per-space containment cost for subtree members until the first hit; validation and placement checks call it per point, so the walk replaced a fixed-point rescan that grew with depth.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one point per call over the caller's mutable record; callers testing many points of one space recompute the subtree each time, a cost bounded by the space count.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The subtree set is dropped on return and nothing else is allocated beyond the predicate's own work.
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
