import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A relation one subject's effector must realize against another subject's
 * region, such as a contact, a reach or a near miss.
 *
 * The target is named, never placed: its world point is read from the target
 * subject's actual pose when the goal resolves, frozen at the window's start
 * (`freeze`) or followed through the window (`track`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A relation one subject's effector must realize against another subject's region, such as a contact, a reach or a near miss) and documents 5 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A relation one subject's effector must realize against another subject's region, such as a contact, a reach or a near miss: interface of 5 members (`surface`, `target`, `approach`, `window`, `lock`); units and frames named in its text: frame, metres, world, seconds. Optional members `approach` express documented absence, and the ranges its member docs state are left to runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieRelationalGoal` in packages/engine/src/composition/IAutoMovieRelationalGoal.ts; its surface is the 5 members listed and the text shows 3 other files naming it, mostly packages/engine (3), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
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
