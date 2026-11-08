import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A relation one subject's effector must realize against another subject's
 * region, such as a contact, a reach or a near miss.
 *
 * The target is named, never placed: its world point is read from the target
 * subject's actual pose when the goal resolves, frozen at the window's start
 * (`freeze`) or followed through the window (`track`).
 */
export interface IAutoMovieRelationalGoal {
  /** The performer's effector: a segment and a point and outward direction in its frame. */
  surface: {
    /** Segment carrying the effector. */
    bone: string;

    /** Effector point in the segment frame, metres. */
    localPoint: IAutoMovieVector3;

    /** Optional effector direction in the segment frame, aligned with `approach`. */
    localDirection?: IAutoMovieVector3;
  };

  /** The named target. */
  target: {
    /** Stable id of the target subject. */
    subject: string;

    /** The target subject's region id, as its body declares regions. */
    region: string;
  };

  /** Optional unit world direction of arrival. */
  approach?: IAutoMovieVector3;

  /** Seconds, film time, during which the relation holds; `start <= end`. */
  window: { start: number; end: number };

  /** Read the target at the window's start (`freeze`) or at each instant (`track`). */
  lock: "freeze" | "track";
}
