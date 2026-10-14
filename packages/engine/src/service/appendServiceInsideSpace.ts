import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieVector3,
} from "@automovie/interface";

import { propSpaceContainsBounds } from "../film/propSpaceContainsBounds";
import { ViolationCollector } from "../validation/ViolationCollector";

/**
 * Hold one authored world point inside the logical space its node stands in.
 *
 * A node is placed in a room, and a port is the point a run is anchored to, so
 * the two answer the same question and are held by the same predicate the
 * architecture holds a prop with. A port allowed to drift out of its node's
 * room is the hole the crossing rule is evaded through: a crossing is read
 * _between_ consecutive route points, so a duct whose terminal port sits in the
 * plant room can be routed entirely inside that room, never appear to leave
 * anywhere, need no sleeve, and still render as the thing that serves the
 * hall.
 *
 * A point that is not finite has already been reported for being unreadable,
 * and a space that does not resolve has already been reported for not existing.
 * Neither is accused a second time of standing in the wrong place, which would
 * send an author looking for a second mistake at one address.
 *
 * @evidence contracts/common.md#principled-implementation A finite point with a resolving logical space is tested as a zero-volume prop bound using the architecture's containment owner, avoiding an independent room-membership convention.
 * @evidence contracts/common.md#clear-and-simple-design Node and port checks invoke one spatial admission helper after their own reference and component diagnostics, leaving room geometry to the shared prop predicate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing spaces and nonfinite points skip only secondary containment accusations because their primary faults are already reported; coordinates are never replaced.
 * @evidence contracts/common.md#meaningful-documentation Documents the point/space premises, node and port use, secondary-error suppression and the original violation path carried by the caller.
 * @evidence contracts/performance.md#efficient-algorithms Three component checks precede the delegated logical-space containment search, whose work depends on the space's current cells and outline predicates.
 * @evidence contracts/performance.md#reuse-equivalent-work The helper consumes the gate's supplied space-id set and one point, retaining no cached membership across moving nodes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a failed source point is appended to the supplied collector; no cell index, bounds record or environment reference is stored here.
 */
export const appendServiceInsideSpace: (props: {
  environment: IAutoMovieBuiltEnvironment;
  spaceIds: ReadonlySet<string>;
  space: string;
  point: IAutoMovieVector3;
  path: string;
  subject: string;
  out: ViolationCollector;
}) => void = (props: {
  environment: IAutoMovieBuiltEnvironment;
  spaceIds: ReadonlySet<string>;
  space: string;
  point: IAutoMovieVector3;
  path: string;
  subject: string;
  out: ViolationCollector;
}): void => {
  if (!props.spaceIds.has(props.space)) return;
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(props.point[axis])) return;
  if (
    propSpaceContainsBounds({
      environment: props.environment,
      space: props.space,
      bounds: { min: props.point, max: props.point },
    })
  )
    return;
  props.out.push(
    "type",
    props.path,
    `${props.subject} stands outside logical space "${props.space}"`,
    props.point,
  );
};
