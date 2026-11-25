import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * A relation one subject's effector must realize against another subject's
 * region, such as a contact, a reach or a near miss.
 *
 * The target is named, never placed: its world point is read from the target
 * subject's actual pose when the goal resolves, frozen at the window's start
 * (`freeze`) or followed through the window (`track`).
 */
export interface IAutoMovieRelationalGoal {
  /**
   * The performer's effector: a segment and a point and outward direction in
   * its frame.
   */
  surface: {
    /** Segment carrying the effector. */
    bone: string;

    /** Effector point in the segment frame, metres. */
    localPoint: IAutoMovieVector3;

    /**
     * Optional unit effector direction in the segment frame. Orientation is
     * fitted only when both this and `approach` are present.
     */
    localDirection?: IAutoMovieVector3;
  };

  /** The named target. */
  target: {
    /** Stable id of the target subject. */
    subject: string;

    /** The target subject's region id, as its body declares regions. */
    region: string;
  };

  /**
   * Optional unit world direction of arrival; without surface.localDirection
   * only the point is fitted.
   */
  approach?: IAutoMovieVector3;

  /** Seconds, film time, during which the relation holds; `start <= end`. */
  window: {
    /**
     * First active film second, inclusive; also the target pose time for freeze
     * mode.
     */
    start: number;
    /**
     * Last active film second, inclusive. The caller supplies an ordered finite
     * interval; the relational resolver does not validate it.
     */
    end: number;
  };

  /**
   * Read the target at the window's start (`freeze`) or at each instant
   * (`track`).
   */
  lock: "freeze" | "track";
}
