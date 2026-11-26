import {
  IAutoMovieBuiltSpace,
  type IAutoMoviePropSpaceContainsBounds,
  IAutoMovieVector3,
} from "@automovie/interface";

import { builtSpaceContainsPoint } from "../../architecture/internal/builtSpaceContainsPoint";
import { builtSpaceStatesVolume } from "../../architecture/internal/builtSpaceStatesVolume";
import { builtSpaceSubtree } from "../../architecture/internal/builtSpaceSubtree";
import { requireBuiltSpace } from "../../architecture/internal/requireBuiltSpace";

/**
 * Whether a world volume lies inside a logical space or the spaces below it.
 *
 * Each of the box's eight corners must lie in some space of the subtree, read
 * through `builtSpaceContainsPoint`, the same per-space rule
 * `builtEnvironmentContainsPoint` folds. The corners may lie in different child
 * spaces, and because only corners are tested, a box whose corners are inside a
 * non-convex space while its middle crosses a notch is accepted.
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
 */
export function propSpaceContainsBounds(
  props: IAutoMoviePropSpaceContainsBounds.IProps,
): boolean {
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
}
