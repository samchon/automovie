import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanHand } from "../posture/HumanHand";
import { pushPullLean } from "./pushPullLean";
import { pushSled } from "./pushSled";
import { pushSledHandles } from "./pushSledHandles";
import { pushSledStance } from "./pushSledStance";

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
 * @evidence contracts/development/common.md#meaningful-documentation States the ways, how each sets the walk and the lean, the source of the lean, the stuck load and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A law over the sled push's hold: the way, the load level and the handles are the haul's, the hold and the grasp the push's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the way, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are the load's own affordances, the lean the study's.
 */
export namespace pushPull {
  /** The action's name. */
  export const name: HumanActionName = "pushPull";

  /** Cancel table: the haul may be left at any time, the load staying where the hands left it. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /** How the load is moved. */
  export type Way = "push" | "pull" | "drag";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The load, its handles, the way, where to, the load level and whether it moves.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The handles are named affordances of the prop; the load is a declared level, not a typed lean.
   */
  export interface IParams {
    /** The moved prop's subject id. */
    prop: string;

    /** How the load is moved. */
    way: Way;

    /** Where the walk goes, world metres; required unless the load does not move. */
    to?: IAutoMovieVector3;

    /** The handle the left hand takes, an affordance id; `left` when absent. */
    left?: string;

    /** The handle the right hand takes, an affordance id; `right` when absent. */
    right?: string;

    /** The load's declared level (`pushPullLean.Load`); `moderate` when absent. */
    load?: pushPullLean.Load;

    /** Whether the load moves; `false` presses it standing in place for `seconds`; `true` when absent. */
    moves?: boolean;

    /** Seconds the hands press a load that does not move; required then, and read only then. */
    seconds?: number;
  }

  /**
   * Plan a haul.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} A `parameter` refusal on `to` when a moving load has nowhere to go, and on `seconds` when a stuck load has no duration; an `affordance` refusal when the prop lacks a named handle; and whatever the sled push refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The lean is read at the handles' mean height above the floor the body stands on, where the load stands at the start.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The checks, the handles' height, the lean, then the push's plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing destination or duration refuses; nothing is defaulted in its place.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two handle lookups before the push's own plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the sled push's hold, its handle reader and its floor.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing beyond the push's plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const moves: boolean = p.moves ?? true;
    if (moves && p.to === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "to",
        value: null,
        feasible: { kind: "alternatives", values: [] },
        reason: `a ${p.way} that moves ${p.prop} needs where the walk goes`,
        fix: "give `to`, or set `moves: false` with `seconds` for a load that does not move",
      });
    if (!moves && p.seconds === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "seconds",
        value: null,
        feasible: { kind: "alternatives", values: [] },
        reason: `a ${p.way} that does not move ${p.prop} needs how long the hands press`,
        fix: "give `seconds`",
      });
    const left: string = p.left ?? "left";
    const right: string = p.right ?? "right";

    // The lean for the declared load at the handles' height above the floor.
    const handles: Record<HumanHand.Side, pushSledHandles.IHandle> =
      pushSledHandles.of(context, p.prop, left, right);
    const height: number =
      (handles.left.frame.point.y + handles.right.frame.point.y) / 2 -
      pushSledStance.floor(context.body, context.entry.feet);
    const incline: number = pushPullLean.of(
      context.body,
      p.way,
      p.load ?? "moderate",
      height,
    );

    // A pull keeps the heading it enters with, so the body faces the load
    // and walks backward drawing it.
    const at: IAutoMovieVector3 = context.entry.posture.root;
    return pushSled.plan({
      ...context,
      params: {
        sled: p.prop,
        to: p.to ?? { x: at.x, y: 0, z: at.z },
        left,
        right,
        incline,
        ...(p.way === "pull"
          ? { facing: { yaw: context.entry.posture.yaw } }
          : {}),
        ...(moves ? {} : { seconds: p.seconds!, moves: false }),
      },
    });
  }
}
