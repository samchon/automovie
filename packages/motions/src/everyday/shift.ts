import type { AutoMovieMotionHumanActionName, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanShift, IAutoMovieVector3 } from "@automovie/interface";

import { minimumJerk } from "@automovie/engine";
import { stand } from "../actions/stand";
import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { seated } from "./seated";

/**
 * Shifting along a bench while seated: the seat socket slides sideways
 * along the seat by the requested distance, while the feet stay planted and
 * the hands stay on the thighs.
 *
 * The goal is the socket's path; the root follows with the seated pitch kept,
 * and the legs and hands are solved by inverse kinematics. A seated person
 * edges along by unweighting the buttocks, not by lifting them off: the
 * seat bears throughout, sliding, so the body never stands on its feet
 * alone with its centre of mass behind them, and the socket keeps to the
 * seat on the slide's minimum-jerk share `s`; the slide lasts `0.6 + |d|`
 * seconds for `d` metres (provisional). The feet do not step, so a shift is
 * limited to what the planted legs allow sideways: 0.35 thigh lengths, which
 * turns each thigh about 19 degrees in abduction or adduction, inside their
 * 30 degree range (provisional); a longer shift is refused and takes several
 * shifts, as people edge along a bench a few tens of centimetres at a time.
 *
 * On a seat above 1.2 of the popliteal height, where a foot is off the
 * floor, the shift is refused: getting off and sitting down again moves
 * the body there.
 *
 * Events `seatOff` (the buttocks unweighted as the slide starts) and
 * `seatContact` (bearing fully again as it ends).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Effector goals (sockets, footprints, the gaze line) solved by the shared inverse kinematics, with balance and timing from the cited laws.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plans once, then evaluates each posture in closed form.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Infeasible requests are refused with the feasible range instead of clamped; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond a few forward-kinematics passes and limb fits.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The plan is computed once per instance and every posture reads it.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold only the instance's own inputs and are released with the performance.
 */
export namespace shift {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "shift";

  /** Cancel table: after setting down a shift may continue sitting. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    rise: [
      { window: ["seatContact", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    shift: [{ window: ["seatContact", 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * Plan a shift.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the shift exceeds the planted legs' side reach.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanShift.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const limit: number = 0.35 * body.measure.thigh;
    if (!(Math.abs(context.params.by) <= limit))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "by",
        value: context.params.by,
        feasible: { kind: "range", minimum: -limit, maximum: limit, unit: "m" },
        reason: `a seated shift moves at most ${limit.toFixed(3)} m without stepping; shift several times`,
        fix: "shift several times, each within the limit",
      });
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const start: IAutoMovieVector3 = seated.socket(body, entry);
    const under: number = seated.floor(body, context.entry);

    // The shift pushes off the feet planted on the floor, which a high seat takes off it.
    if (
      (start.y - under) / seated.popliteal(body) > seated.RATIO[1] &&
      (["left", "right"] as const).some(
        (side: "left" | "right"): boolean =>
          !context.entry.feet[side].planted ||
          context.entry.feet[side].ankle.y >
            under + body.measure.ankleHeight + 0.5 * body.measure.thighRadius,
      )
    )
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: "a high seat",
        feasible: { kind: "alternatives", values: ["rise", "sit"] },
        reason: `a seated shift edges along on both planted feet, and this seat holds a foot off the floor`,
        fix: "get off the seat and sit down again where the shift would end",
      });
    const goal: IAutoMovieVector3 = HumanFrame.point(
      { origin: start, yaw: entry.yaw },
      { x: context.params.by, y: 0, z: 0 },
    );
    const slide: number = 0.6 + Math.abs(context.params.by);
    const duration: number = slide + (context.params.seconds ?? 0.5);
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      entry.yaw,
    );
    const lift: number = 0.15 * slide;
    const set: number = 0.85 * slide;
    return {
      duration,
      // A shift slides along the seat it was entered on and stays seated on
      // it (#3363: a base transition declares the base it ends in).
      base:
        context.entry.base.kind === "seated"
          ? context.entry.base
          : { kind: "seated" },
      events: [
        { name: "seatOff", share: lift / duration },
        { name: "seatContact", share: set / duration },
      ],
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: HumanSupportFrame.contact(context, "leftFoot"),
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 1,
          support: HumanSupportFrame.contact(context, "rightFoot"),
        },
        {
          part: "seat",
          kind: "seat",
          from: 0,
          to: 1,
          support: HumanSupportFrame.contact(context, "seat"),
        },
      ],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = minimumJerk(t / slide).s;
        const socket: IAutoMovieVector3 = {
          x: start.x + (goal.x - start.x) * s,
          y: start.y,
          z: start.z + (goal.z - start.z) * s,
        };
        const root: IAutoMovieVector3 = seated.root(body, socket, entry);
        const posture: IAutoMovieMotionHumanPosture = {
          ...entry,
          root,
          limbs: stand.legs(body, root, entry.yaw, feet),
        };
        return seated.arms(body, posture, 1);
      },
    };
  }
}
