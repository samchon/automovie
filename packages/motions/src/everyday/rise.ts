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
 * Standing up from a seat, in the four phases of sit-to-stand (Schenkman,
 * Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum,
 * where the trunk flexes forward while the seat still bears the weight;
 * momentum transfer at seat-off, where the hips leave the seat and the body
 * moves forward over the feet; extension of the hips and knees; and
 * stabilisation.
 *
 * The goal is the seat socket's path from where it rests to where it stands
 * over the planted feet; the root follows from it and the trunk's pitch, and
 * the legs are solved onto the unmoved feet. The trunk pitches from its
 * seated angle to `35 + 50 (1 - r)` degrees over the first 30 % (seat-off),
 * the socket travels forward from 30 % and up from 33 % to 85 % (standing),
 * and the trunk returns upright by the end; the hands leave the thighs from
 * 30 % and hang by 60 %. The time is `2 (1 + 0.6 (1 - r))` seconds for a
 * seat at `r` of the knee height, the seat height being where the socket
 * rests. Phase shares and coefficients are provisional; Schenkman et al.
 * describe the phases, not these exact shares.
 *
 * The rise reads only the seated posture it is entered from, so it follows
 * a sit, a shift or any posture with the socket on a seat. Events `seatOff`
 * and `standing`; the seat window ends at seat-off.
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
export namespace rise {
  /** The action's name. */
  export const name: HumanActionName = "rise";

  /** Cancel table: a rise cut before seat-off returns to sitting; after standing it may become anything a stand can. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    sit: [{ window: [0, "seatOff"], kind: "inertialize", entry: 0, blend: 0.3 }],
    stand: [{ window: ["standing", 1], kind: "inertialize", entry: 0 }],
    walk: [{ window: ["standing", 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /** Parameters: none; the rise starts from the seated entry. */
  export type IParams = Record<string, never>;

  /**
   * Plan a rise.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const start: IAutoMovieVector3 = seated.socket(body, context.entry.posture);
    const r: number = start.y / seated.knee(body);
    const duration: number = 2 * (1 + 0.6 * (1 - r));
    const peak: number = 35 + 50 * (1 - r);
    const yaw: number = context.entry.posture.yaw;
    const pitch0: number = context.entry.posture.pitch;
    const feet: Record<"left" | "right", IAutoMovieVector3> = stand.feet(body, context.entry, yaw);

    // The standing posture the rise ends in: the stand law's pelvis over the feet's midpoint.
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: (body.rest.get("leftFoot")!.x + body.rest.get("rightFoot")!.x) / 2, y: 0, z: (body.rest.get("leftFoot")!.z + body.rest.get("rightFoot")!.z) / 2 },
    );
    const standRoot: IAutoMovieVector3 = { x: (feet.left.x + feet.right.x) / 2 - centre.x, y: -0.005, z: (feet.left.z + feet.right.z) / 2 - centre.z };
    const goal: IAutoMovieVector3 = seated.socket(body, { root: standRoot, yaw, pitch: 0, roll: 0, joints: {}, limbs: {} });
    const off: number = 0.3 * duration;

    return {
      duration,
      events: [
        { name: "seatOff", share: 0.3 },
        { name: "standing", share: 0.85 },
      ],
      contacts: [
        { part: "leftFoot", kind: "plant", from: 0, to: 1, support: { kind: "ground" } },
        { part: "rightFoot", kind: "plant", from: 0, to: 1, support: { kind: "ground" } },
        { part: "seat", kind: "seat", from: 0, to: 0.3, support: { kind: "ground" } },
      ],
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const forward: number = minimumJerk((t - off) / (0.85 * duration - off)).s;
        const up: number = minimumJerk((t - 0.33 * duration) / (0.52 * duration)).s;
        const socket: IAutoMovieVector3 = {
          x: start.x + (goal.x - start.x) * forward,
          y: start.y + (goal.y - start.y) * up,
          z: start.z + (goal.z - start.z) * forward,
        };
        const pitch: number = t < off ? pitch0 + (peak - pitch0) * minimumJerk(t / off).s : peak * (1 - minimumJerk((t - 0.45 * duration) / (0.55 * duration)).s);
        const root: IAutoMovieVector3 = seated.root(body, socket, { yaw, pitch, roll: 0 });
        const posture: IHumanPosture = { root, yaw, pitch, roll: 0, joints: { ...stand.RELAXED }, limbs: stand.legs(body, root, yaw, feet) };
        return seated.arms(body, posture, 1 - minimumJerk((t - off) / (0.3 * duration)).s);
      },
    };
  }
}
