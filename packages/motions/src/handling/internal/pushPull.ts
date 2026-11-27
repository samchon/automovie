import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPushPull,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { pushPullLean } from "./pushPullLean";
import { pushSled } from "./pushSled";
import { pushSledHandles } from "./pushSledHandles";
import { pushSledStance } from "./pushSledStance";

/*
 * A heavy load that is not carried moved by its two handles: a crate, a
 * wardrobe or a car pushed ahead walking forward, pulled toward the body
 * walking backward, or a sack dragged behind walking forward; or pushed and
 * pulled at and not moved at all, the scene where force is shown and nothing
 * moves.
 *
 * The hold is the sled push's (`pushSled`): the hands reach the handles where
 * the load stands, close on them and are carried with the chest, so the gripped
 * load goes where the hands go; the push's grasp search, its sink onto bent
 * knees and its refusal of a handle out of reach are its own. What the haul
 * sets is the way and the trunk's lean:
 *
 * - `push`: the walk goes forward to `to`, the trunk leaning into the load.
 * - `pull`: the walk goes backward to `to`, the body keeping the heading it
 *   enters with, so it faces the load it draws, the trunk leaning back.
 * - `drag`: the walk goes forward to `to` with the handles behind the body, the
 *   trunk leaning forward.
 *
 * The lean is the measured one for the declared load at the handles' height
 * (`pushPullLean`, Lett and McGill 2006), so a heavier load leans the trunk
 * further. The walk is the push's slow one, its steps shorter than a free
 * walk's. A load that does not move (`moves: false`) is pressed for `seconds`
 * standing in place, the hands bearing on its handles without gripping, so it
 * stays where it stands.
 *
 * First pass, not yet: walking a tall load corner by corner (the load's own
 * pivot on the floor is not modelled), the breakaway and per-step events, the
 * step-to-step pauses a seed draws under heavy loads, and the load's friction
 * slowing the walk.
 */
export namespace pushPull {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "pushPull";

  /*
   * Cancel table: the haul may be left at any time, the load staying where the
   * hands left it.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /*
   * Plan a haul.
   * Parameter context: The action's context.
   * Returns: The plan.
   * A `parameter` refusal on `to` when a moving load has
   * nowhere to go, and on `seconds` when a stuck load has no duration; an
   * `affordance` refusal when the prop lacks a named handle; and whatever the
   * sled push refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPushPull.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanPushPull.IParams = context.params;
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
    if (!moves && p.duration === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "duration",
        value: null,
        feasible: { kind: "alternatives", values: [] },
        reason: `a ${p.way} that does not move ${p.prop} needs how long the hands press`,
        fix: "give `seconds`",
      });
    const left: string = p.left ?? "left";
    const right: string = p.right ?? "right";

    // The lean for the declared load at the handles' height above the floor.
    const handles: Record<AutoMovieHumanSide, pushSledHandles.IHandle> =
      pushSledHandles(context, p.prop, left, right);
    const height: number =
      (handles.left.frame.point.y + handles.right.frame.point.y) / 2 -
      pushSledStance.floor(context.body, context.entry.feet);
    const incline: number = pushPullLean(
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
        ...(moves ? {} : { duration: p.duration!, moves: false }),
      },
    });
  }
}
