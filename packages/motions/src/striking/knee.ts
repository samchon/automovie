import { Vector3, minimumJerk } from "@automovie/engine";
import type { AutoMovieHumanoidBone, AutoMovieMotionTarget, IAutoMovieMotionEvent, IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "./StrikingBody";
import { StrikingSkill } from "./StrikingSkill";
import { StrikingStance } from "./StrikingStance";
import { StrikingTarget } from "./StrikingTarget";

/**
 * A knee strike: the knee driven up and forward onto the target while the
 * hands hold the opponent's head or neck (the clinch) or stay at the guard.
 *
 * The knee is the weapon, so the goal is the knee joint itself: the knee
 * region's point (the front of the patella) is brought onto the target point,
 * which puts the knee joint one patella depth behind it along the drive; the
 * thigh then needs the hip one thigh length from that knee, so the pelvis
 * drives forward to it (the hip thrust of the clinch knee) by at most a
 * quarter of a stance length, beyond which the knee extends along the line
 * and falls short, the declared miss-at-maximum-reach rule. The ankle folds
 * under the knee, the shank swinging back with the knee flexed about 120
 * degrees (provisional reading of coaching photographs). The support foot
 * pivots on its ball and the trunk leans back slightly to keep the centre of
 * mass over it.
 *
 * Timing (kickboxing research of #3201): the knee rises through the round
 * kick's chamber only, so it lands at the chamber key (preparation 0.074 s
 * plus 14 % of the 1.02 s execution) and recoils over the kick's 0.65 s;
 * skill scales them like the kick's. With a person target, both hands reach
 * the other's nape for the clinch; GLORY allows one knee per clinch, which
 * the kickboxing rules check.
 */
export namespace knee {
  /** The action's name. */
  export const name: HumanActionName = "knee";

  /** Cancel table: none; a knee runs to its replant. */
  export const interrupts: IHumanActionLaw["interrupts"] = {};

  /** Parameters. */
  export interface IParams {
    /** What it strikes. */
    at: AutoMovieMotionTarget;

    /** Which leg: lead or rear; rear when absent. */
    leg?: "lead" | "rear";
  }

  /** Knee flexion while driven, degrees (provisional). */
  export const FLEXION: number = 120;

  /** Back lean at contact, degrees (provisional). */
  export const LEAN: number = 10;

  /**
   * Plan a knee strike.
   *
   * @param context The action's context.
   * @returns The plan.
   */
  export function plan(context: IHumanActionContext<IParams>): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const side: "left" | "right" = (p.leg ?? "rear") === "lead" ? lead : StrikingStance.rear({ lead });
    const support: "left" | "right" = side === "left" ? "right" : "left";
    const slow: number = StrikingSkill.recovery(context.skill);
    const prep: number = StrikingSkill.KICK_PREPARATION;
    const impact: number = prep + StrikingSkill.KICK_CHAMBER * slow;
    const duration: number = impact + StrikingSkill.KICK_RECOIL * slow;
    const entry: IHumanPosture = context.entry.posture;
    const feet: Record<"left" | "right", HumanFoot.IPlacement> = StrikingTarget.feet(context.entry);
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const t0: number = context.start;

    let built: { knee: IAutoMovieVector3; ankle: IAutoMovieVector3; thrust: IAutoMovieVector3; line: IAutoMovieVector3 } | undefined;
    const geometry = () => {
      if (built !== undefined) return built;
      const target: IAutoMovieVector3 = context.aim(p.at, t0 + impact).point;
      const line: IAutoMovieVector3 = StrikingTarget.line(entry.root, target, entry.yaw);
      const drive: IAutoMovieVector3 = Vector3.normalize(Vector3.add(Vector3.scale(line, 0.8), Vector3.scale(up, 0.6)));
      const patella: number = Vector3.length(body.surfaces.regions[side === "left" ? "kneeLeft" : "kneeRight"].point);
      const knee: IAutoMovieVector3 = Vector3.subtract(target, Vector3.scale(drive, patella));
      const hip: IAutoMovieVector3 = StrikingBody.trunk(body, entry).get(`${side}UpperLeg` as AutoMovieHumanoidBone)!.worldPosition;
      const needed: IAutoMovieVector3 = Vector3.subtract(knee, Vector3.scale(Vector3.normalize(Vector3.subtract(knee, hip)), m.thigh));
      const shift: IAutoMovieVector3 = Vector3.subtract(needed, hip);
      const limit: number = 0.25 * StrikingStance.length(body);
      const thrust: IAutoMovieVector3 = Vector3.length(shift) > limit ? Vector3.scale(Vector3.normalize(shift), limit) : shift;
      const reached: IAutoMovieVector3 = Vector3.add(Vector3.add(hip, thrust), Vector3.scale(Vector3.normalize(Vector3.subtract(knee, Vector3.add(hip, thrust))), m.thigh));
      const thigh: IAutoMovieVector3 = Vector3.normalize(Vector3.subtract(reached, Vector3.add(hip, thrust)));
      const fold: IAutoMovieVector3 = Vector3.normalize(Vector3.add(Vector3.scale(thigh, Math.cos((FLEXION * Math.PI) / 180)), Vector3.scale(Vector3.normalize(Vector3.subtract(Vector3.scale(up, -1), Vector3.scale(thigh, -Vector3.dot(up, thigh)))), Math.sin((FLEXION * Math.PI) / 180))));
      built = { knee: reached, ankle: Vector3.add(reached, Vector3.scale(fold, m.shank)), thrust, line };
      return built;
    };
    const events: IAutoMovieMotionEvent[] = [
      { name: "launch", share: prep / duration },
      { name: "impact", share: impact / duration },
      { name: "replant", share: 1 },
    ];
    const contacts: IHumanContactWindow[] = [
      { part: `${side}Foot`, kind: "plant", from: 0, to: prep / duration, support: { kind: "ground" } },
      { part: `${side}Foot`, kind: "plant", from: 1, to: 1, support: { kind: "ground" } },
      { part: `${support}Foot`, kind: "pivot", from: 0, to: 1, support: { kind: "ground" } },
    ];
    return {
      duration,
      events,
      contacts,
      contact: impact,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const g = geometry();
        const out: number = minimumJerk((t - prep) / (impact - prep)).s;
        const back: number = minimumJerk((t - impact) / (duration - impact)).s;
        const w: number = out - back;
        const supportFoot: HumanFoot.IPlacement = StrikingTarget.pivot(body, support, feet[support], 0, 15 * w);
        const placed: Record<"left" | "right", HumanFoot.IPlacement> = side === "left" ? { left: feet.left, right: supportFoot } : { left: supportFoot, right: feet.right };
        const posture: IHumanPosture = {
          root: Vector3.add(entry.root, Vector3.scale(g.thrust, w)),
          yaw: entry.yaw,
          pitch: entry.pitch - LEAN * w,
          roll: entry.roll,
          joints: { ...entry.joints, ...StrikingStance.joints() },
          limbs: StrikingStance.legs(body, placed, { left: side !== "left", right: side !== "right" }),
        };
        const rest: IAutoMovieVector3 = feet[side].ankle;
        const ankle: IAutoMovieVector3 = Vector3.lerp(Vector3.lerp(rest, g.ankle, out), rest, back);
        const knee: IAutoMovieVector3 = Vector3.add(Vector3.lerp(Vector3.add(rest, Vector3.scale(up, m.shank)), g.knee, out), Vector3.scale(g.line, 0.1));
        const leg: "leftLeg" | "rightLeg" = side === "left" ? "leftLeg" : "rightLeg";
        const hands = StrikingStance.guard(body, posture, { lead });
        if (p.at.kind === "person") {
          const nape: IAutoMovieVector3 = context.performer(p.at.subject).bones(t0 + t).get("neck")!.worldPosition;
          for (const arm of ["leftArm", "rightArm"] as const) {
            const g0: IHumanPosture.IGoal | undefined = hands[arm];
            if (g0 === undefined) continue;
            const hold: IAutoMovieVector3 = Vector3.add(nape, Vector3.scale(g.line, 0.03));
            hands[arm] = { ...g0, point: Vector3.lerp(g0.point, hold, Math.min(1, 2 * w)) };
          }
        }
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            ...hands,
            [leg]: { point: ankle, bend: knee, rotation: feet[side].rotation, ...(t <= prep || t >= duration - 1e-9 ? { planted: true } : {}) },
          },
        };
      },
    };
  }
}
