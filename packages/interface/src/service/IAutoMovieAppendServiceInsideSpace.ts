import type { IAutoMovieBuiltEnvironment } from "../architecture/IAutoMovieBuiltEnvironment";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieViolationAppendSink } from "../validation/IAutoMovieViolationAppendSink";

/**
 * One world-space service point and its owning logical-space containment
 * context.
 */
export namespace IAutoMovieAppendServiceInsideSpace {
  /**
   * One world-space service point and its owning logical-space containment
   * context.
   *
   * A node is placed in a room, and a port is the point a run is anchored to,
   * so the two answer the same question and are held by the same predicate the
   * architecture holds a prop with. A port allowed to drift out of its node's
   * room is the hole the crossing rule is evaded through: a crossing is read
   * _between_ consecutive route points, so a duct whose terminal port sits in
   * the plant room can be routed entirely inside that room, never appear to
   * leave anywhere, need no sleeve, and still render as the thing that serves
   * the hall.
   *
   * A point that is not finite has already been reported for being unreadable,
   * and a space that does not resolve has already been reported for not
   * existing. Neither is accused a second time of standing in the wrong place,
   * which would send an author looking for a second mistake at one address.
   */
  export type IProps = {
    /**
     * Borrowed building whose logical-space geometry supplies containment; it
     * must agree with spaceIds.
     */
    environment: IAutoMovieBuiltEnvironment;

    /**
     * Borrowed declared logical-space ids; an absent id skips this check
     * because its reference error is reported separately.
     */
    spaceIds: ReadonlySet<string>;

    /** Owning logical-space id used for both a node and every port on that node. */
    space: string;

    /**
     * Borrowed world-metre position; non-finite components skip containment and
     * an outside-point finding retains this object.
     */
    point: IAutoMovieVector3;

    /** Exact diagnostic address of the position being checked. */
    path: string;

    /**
     * Human-readable node or port description inserted in the outside-space
     * finding.
     */
    subject: string;

    /**
     * Synchronous caller-owned sink receiving an outside-space finding;
     * exceptions propagate.
     */
    out: IAutoMovieViolationAppendSink;
  };
}
