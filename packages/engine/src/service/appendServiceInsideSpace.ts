import type { IAutoMovieAppendServiceInsideSpace } from "@automovie/interface";

import { propSpaceContainsBounds } from "../film/propSpaceContainsBounds";

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
 */
export function appendServiceInsideSpace(
  props: IAutoMovieAppendServiceInsideSpace.IProps,
): void {
  if (!props.spaceIds.has(props.space)) return;
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
}
