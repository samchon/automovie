import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionHumanPushPullLean } from "./IAutoMovieMotionHumanPushPullLean";

/**
 * A heavy load that is not carried moved by its two handles (#3351): a
 * crate, a wardrobe or a car pushed ahead walking forward, pulled toward the
 * body walking backward, or a sack dragged behind walking forward; or
 * pushed and pulled at and not moved at all, the scene where force is shown
 * and nothing moves.
 *
 * The hold is the sled push's (`pushSled`): the hands reach the handles
 * where the load stands, close on them and are carried with the chest, so
 * the gripped load goes where the hands go; the push's grasp search, its
 * sink onto bent knees and its refusal of a handle out of reach are its
 * own. What the haul sets is the way and the trunk's lean:
 *
 * - `push`: the walk goes forward to `to`, the trunk leaning into the load.
 * - `pull`: the walk goes backward to `to`, the body keeping the heading it
 *   enters with, so it faces the load it draws, the trunk leaning back.
 * - `drag`: the walk goes forward to `to` with the handles behind the body,
 *   the trunk leaning forward.
 *
 * The lean is the measured one for the declared load at the handles' height
 * (`pushPullLean`, Lett and McGill 2006), so a heavier load leans the trunk
 * further. The walk is the push's slow one, its steps shorter than a free
 * walk's. A load that does not move (`moves: false`) is pressed for
 * `seconds` standing in place, the hands bearing on its handles without
 * gripping, so it stays where it stands.
 *
 * First pass, not yet: walking a tall load corner by corner (the load's own
 * pivot on the floor is not modelled), the breakaway and per-step events,
 * the step-to-step pauses a seed draws under heavy loads, and the load's
 * friction slowing the walk.
 *
 * @evidence contracts/development/common.md#meaningful-documentation to: Where the walk goes, world metres; required unless the load does not move. left: The handle the left hand takes, an affordance id; `left` when absent. right: The handle the right hand takes, an affordance id; `right` when absent.
 * @evidence contracts/development/design.md#principled-representation to: Where the walk goes, world metres; required unless the load does not move. left: The handle the left hand takes, an affordance id; `left` when absent. right: The handle the right hand takes, an affordance id; `right` when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: chain/HumanChainTravel.ts (HumanChainTravel.pushPull, params); handling/pushPull.ts (pushPull.plan, context); handling/pushPull.ts (pushPull.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanPushPullLean.Load identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanPushPull {
  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The load, its handles, the way, where to, the load level and whether it moves.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are named affordances of the prop; the load is a declared level, not a typed lean.
   *
   * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
   */
  export interface IParams {
    /** The moved prop's subject id. */
    prop: string;

    /** How the load is moved. */
    way: IAutoMovieMotionHumanPushPull.Way;

    /** Where the walk goes, world metres; required unless the load does not move. */
    to?: IAutoMovieVector3;

    /** The handle the left hand takes, an affordance id; `left` when absent. */
    left?: string;

    /** The handle the right hand takes, an affordance id; `right` when absent. */
    right?: string;

    /** The load's declared level (`IAutoMovieMotionHumanPushPullLean.Load`); `moderate` when absent. */
    load?: IAutoMovieMotionHumanPushPullLean.Load;

    /** Whether the load moves; `false` presses it standing in place for `seconds`; `true` when absent. */
    moves?: boolean;

    /** Seconds the hands press a load that does not move; required then, and read only then. */
    seconds?: number;
  }

  /**
   * How the load is moved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation How the load is moved.
   * @evidence contracts/development/design.md#principled-representation Closed choices "push", "pull", "drag" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Public boundary formerly declared in handling/pushPull.ts; canonical declarations reference this identity directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
   */
  export type Way = "push" | "pull" | "drag";
}
