import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
  IAutoMoviePropBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtSpaceContainsPoint } from "../architecture/builtSpaceContainsPoint";
import { builtSpaceStatesVolume } from "../architecture/builtSpaceStatesVolume";
import { builtSpaceSubtree } from "../architecture/builtSpaceSubtree";
import { requireBuiltSpace } from "../architecture/requireBuiltSpace";

/**
 * Whether a world volume lies inside a logical space or the spaces below it.
 *
 * Each of the box's eight corners must lie in some space of the subtree, read
 * through `builtSpaceContainsPoint`, the same per-space rule
 * `builtEnvironmentContainsPoint` folds. The corners may lie in different child
 * spaces, and because only corners are tested, a box whose corners are inside
 * a non-convex space while its middle crosses a notch is accepted.
 *
 * A subtree that states no volume at all locates nothing, so it excludes
 * nothing and the answer is `true`: a purely semantic container such as "the
 * west wing" is a name, not a boundary, and refusing props inside it would
 * invent a geometric claim the author never made. An undeclared space throws
 * the `Error` of `requireBuiltSpace`. The prop placement gate and the service
 * network gate judge `in-space` containment with it.
 *
 * @param props.environment The building that declares the space.
 * @param props.space Id of the logical space.
 * @param props.bounds World volume to test, in metres.
 * @returns True when every corner is inside, or the subtree states no volume.
 *
 * @evidence contracts/common.md#principled-implementation A corner test against the union of the subtree's stated volumes, each by the shared per-space containment rule; exact for convex spaces, where a box is inside exactly when its corners are, and a stated limitation for non-convex ones, whose notches a corner test cannot see.
 * @evidence contracts/common.md#clear-and-simple-design The undeclared-id refusal, the subtree fold, the stated-volume test and the per-space containment are the shared architecture queries; this function only applies them to a box's corners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No space or prop is special-cased; the semantic-container answer follows from the stated-volume test for every space alike rather than from a name.
 * @evidence contracts/common.md#meaningful-documentation States the corner rule, that corners may fall in different child spaces, the non-convex limitation, the unlocated subtree answer and why, the thrown error, its callers, and each parameter's meaning and units.
 * @evidence contracts/performance.md#efficient-algorithms The subtree is walked once, linear in the space count, and each of the eight corners is tested against only the subtree's spaces, stopping at the first corner outside, instead of rebuilding the subtree for every corner.
 * @evidence contracts/performance.md#reuse-equivalent-work The validated root, the subtree and its space list are resolved once per call and shared by all eight corner tests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The subtree set and space list are dropped on return and nothing is retained.
 */
export const propSpaceContainsBounds = (props: {
  environment: IAutoMovieBuiltEnvironment;
  space: string;
  bounds: IAutoMoviePropBox;
}): boolean => {
  requireBuiltSpace(props.environment, props.space);
  const included: Set<string> = builtSpaceSubtree(
    props.environment.spaces,
    props.space,
  );
  const subtree: IAutoMovieBuiltSpace[] = props.environment.spaces.filter(
    (space: IAutoMovieBuiltSpace): boolean => included.has(space.id),
  );
  if (!subtree.some(builtSpaceStatesVolume)) return true;
  const min: IAutoMovieVector3 = props.bounds.min;
  const max: IAutoMovieVector3 = props.bounds.max;
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y])
      for (const z of [min.z, max.z])
        if (
          !subtree.some((space: IAutoMovieBuiltSpace): boolean =>
            builtSpaceContainsPoint(space, { x, y, z }),
          )
        )
          return false;
  return true;
};
