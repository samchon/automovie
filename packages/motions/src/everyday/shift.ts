import { minimumJerk } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { seated } from "./seated";

/**
 * Shifting along a bench while seated: the seat socket lifts at most 3 cm
 * (provisional), slides sideways along the seat by the requested distance
 * and sets down again, while the feet stay planted and the hands stay on the
 * thighs.
 *
 * The goal is the socket's path; the root follows with the seated pitch kept,
 * and the legs and hands are solved by inverse kinematics. A seated person
 * edges along by unweighting the buttocks briefly; the lift follows
 * `0.03 sin(pi s)` metres over the slide's minimum-jerk share `s`, and the
 * slide lasts `0.6 + |d|` seconds for `d` metres (provisional). The feet do
 * not step, so a shift is limited to the side-to-side reach the planted legs
 * allow: half the hip breadth either way (provisional); a longer shift is
 * refused and takes several shifts, each a few tens of centimetres as people
 * edge along a bench.
 *
 * Events `seatOff` and `seatContact`.
 */
export namespace shift {
  /** The action's name. */
  export const name: HumanActionName = "shift";

  /** Cancel table: after setting down a shift may continue sitting. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    rise: [{ window: ["seatContact", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
    shift: [{ window: ["seatContact", 1], kind: "inertialize", entry: 0 }],
  };

  /** Parameters. */
  export interface IParams {
    /** Distance along the seat, metres; positive toward the performer's left. */
    by: number;

    /** Seconds to stay seated after setting down; 0.5 when absent. */
    seconds?: number;
  }

  /** Lift of the socket, metres (provisional). */
  export const LIFT: number = 0.03;

  /**
   * Plan a shift.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the shift exceeds the planted legs' side reach.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const limit: number = body.measure.hipHalfWidth;
    if (!(Math.abs(context.params.by) <= limit))
      throw new Error(`${context.subject}: a seated shift moves at most ${limit.toFixed(3)} m without stepping; shift several times`);
    const entry: IHumanPosture = context.entry.posture;
    const start: IAutoMovieVector3 = seated.socket(body, entry);
    const goal: IAutoMovieVector3 = HumanFrame.point({ origin: start, yaw: entry.yaw }, { x: context.params.by, y: 0, z: 0 });
    const slide: number = 0.6 + Math.abs(context.params.by);
    const duration: number = slide + (context.params.seconds ?? 0.5);
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(body, context.entry, entry.yaw);
    const lift: number = 0.15 * slide;
    const set: number = 0.85 * slide;
    return {
      duration,
      events: [
        { name: "seatOff", share: lift / duration },
        { name: "seatContact", share: set / duration },
      ],
      contacts: [
        { part: "leftFoot", kind: "plant", from: 0, to: 1, support: { kind: "ground" } },
        { part: "rightFoot", kind: "plant", from: 0, to: 1, support: { kind: "ground" } },
        { part: "seat", kind: "seat", from: 0, to: lift / duration, support: { kind: "ground" } },
        { part: "seat", kind: "seat", from: set / duration, to: 1, support: { kind: "ground" } },
      ],
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const s: number = minimumJerk(t / slide).s;
        const socket: IAutoMovieVector3 = {
          x: start.x + (goal.x - start.x) * s,
          y: start.y + LIFT * Math.sin(Math.PI * s),
          z: start.z + (goal.z - start.z) * s,
        };
        const root: IAutoMovieVector3 = seated.root(body, socket, entry);
        const posture: IHumanPosture = { ...entry, root, limbs: stand.legs(body, root, entry.yaw, feet) };
        return seated.arms(body, posture, 1);
      },
    };
  }
}
