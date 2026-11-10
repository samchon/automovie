import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { StrikingBody } from "../striking/StrikingBody";
import { StrikingQuality } from "../striking/StrikingQuality";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";

/**
 * A flinch: the protective startle away from a sudden threat or a blow, the
 * head and trunk pulled away from it, the shoulders raised and the hands
 * brought up before the face, then a return to what the body held.
 *
 * The startle pattern (Landis and Hunt 1939, The Startle Pattern; Brown et
 * al. 1991, Brain 114:1891) starts with the eye blink at 30 to 50 ms, the head
 * at about 60 ms and the arms near 100 ms, peaks within about 0.2 s and fades
 * over a few tenths of a second, so the flinch reaches its peak at 0.2 s and
 * returns by 0.6 s. Its size grows with `intensity`: the head moves up to
 * one head radius away from the threat through the trunk's lean (up to 12
 * degrees) and a 3 cm root shift, and the gloves rise to cover the face
 * (provisional sizes, no located kinematic amplitude). The feet stay planted.
 * The threat is a target (the incoming weapon's region, a prop, a point), read
 * at the start.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the startle pattern, its timing with sources, the provisional sizes and that the feet stay planted.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table, parameters and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the timing constants and the plan the law table and the performance dispatch through.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, contact-window and target types; no body is special-cased.
 */
export namespace flinch {
  /** The action's name. */
  export const name: HumanActionName = "flinch";

  /** Cancel table: a flinch flows into a guard, a defence or a stagger. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    guard: [{ window: [0.3, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
    defend: [{ window: [0.3, 1], kind: "inertialize", entry: 0, blend: 0.1 }],
    stagger: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.08 }],
    knockdown: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.08 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the threat's target and the intensity's range and default.
   * @evidence contracts/development/design.md#principled-representation The threat is the interface's motion-target union and the intensity a share in (0, 1], checked when planning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union.
   */
  export interface IParams {
    /** Where the threat comes from. */
    from: AutoMovieMotionTarget;

    /** How strong, in (0, 1]; 1 when absent. */
    intensity?: number;
  }

  /** Startle peak, seconds (Brown et al. 1991). */
  export const PEAK: number = 0.2;

  /** The whole flinch, seconds. */
  export const DURATION: number = 0.6;

  /**
   * Plan a flinch.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {Error} When the intensity lies outside (0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States its input, its plan and its refusal.
   * @evidence contracts/development/implementation.md#principled-implementation An out-and-back minimum-jerk profile peaking at the measured startle peak; the gloves' goals come from the face region and the fist sockets and are solved by the shared limb fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the threat once, then evaluates each posture in closed form.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An intensity outside its range throws; the sizes are named provisional constants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per posture beyond one trunk resolution.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The threat's direction is computed once per plan and dropped on settle, when the threat may have moved.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds one cached direction, cleared by settle and released with the plan.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const intensity: number = context.params.intensity ?? 1;
    if (!(intensity > 0 && intensity <= 1))
      throw new Error("A flinch's intensity lies in (0, 1]");
    const body = context.body;
    const m = body.measure;
    const entry: IHumanPosture = context.entry.posture;
    const lead: "left" | "right" = StrikingTarget.lead(context.entry);
    const events: IAutoMovieMotionEvent[] = [
      { name: "peak", share: PEAK / DURATION },
    ];
    const contacts: IHumanContactWindow[] = (
      ["leftFoot", "rightFoot"] as const
    ).map(
      (part): IHumanContactWindow => ({
        part,
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      }),
    );
    let away: IAutoMovieVector3 | undefined;
    const direction = (): IAutoMovieVector3 => {
      if (away !== undefined) return away;
      const threat: IAutoMovieVector3 = context.aim(
        context.params.from,
        context.start - StrikingTarget.LOOK,
      ).point;
      const head: IAutoMovieVector3 = StrikingBody.trunk(body, entry).get(
        "head",
      )!.worldPosition;
      const d: IAutoMovieVector3 = {
        x: head.x - threat.x,
        y: 0,
        z: head.z - threat.z,
      };
      away =
        Vector3.length(d) > 1e-6
          ? Vector3.normalize(d)
          : {
              x: -Math.sin((entry.yaw * Math.PI) / 180),
              y: 0,
              z: -Math.cos((entry.yaw * Math.PI) / 180),
            };
      return away;
    };
    return {
      duration: DURATION,
      events,
      contacts,
      settle: (): void => {
        away = undefined;
      },
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(DURATION, Math.max(0, seconds));
        const k: number =
          intensity *
          (minimumJerk(t / PEAK).s -
            minimumJerk((t - PEAK) / (DURATION - PEAK)).s);
        const d: IAutoMovieVector3 = direction();
        const r: number = (entry.yaw * Math.PI) / 180;
        const forward: IAutoMovieVector3 = {
          x: Math.sin(r),
          y: 0,
          z: Math.cos(r),
        };
        const left: IAutoMovieVector3 = {
          x: Math.cos(r),
          y: 0,
          z: -Math.sin(r),
        };
        const tilt: number = 12 * k;
        const posture: IHumanPosture = {
          root: Vector3.add(entry.root, Vector3.scale(d, 0.03 * k)),
          yaw: entry.yaw,
          // Leaning away: a forward tip when the threat is behind, a back
          // tip when it is ahead; a tip to the side away from it.
          pitch: entry.pitch + tilt * Vector3.dot(d, forward),
          roll: entry.roll - tilt * Vector3.dot(d, left),
          joints: {
            ...entry.joints,
            ...StrikingStance.joints(),
            neck: [12 + 10 * k, 0, 0],
          },
          limbs: { ...entry.limbs },
        };
        const bones = StrikingBody.trunk(body, posture);
        const face = StrikingBody.region(body, bones, "face");
        const fist: number = StrikingQuality.fist(m.hand);
        const limbs: IHumanPosture["limbs"] = { ...posture.limbs };
        const guard = StrikingStance.guard(body, posture, { lead });
        for (const side of ["left", "right"] as const) {
          const arm: "leftArm" | "rightArm" =
            side === "left" ? "leftArm" : "rightArm";
          const out: IAutoMovieVector3 = Vector3.scale(
            left,
            side === "left" ? 1 : -1,
          );
          const at: IAutoMovieVector3 = Vector3.add(
            Vector3.add(
              face.point,
              Vector3.scale(face.normal, m.forearmRadius + fist),
            ),
            Vector3.scale(out, fist),
          );
          const rotation = StrikingBody.fist(
            body,
            side,
            { x: 0, y: 1, z: 0 },
            Vector3.scale(face.normal, -1),
          );
          const goal: IHumanPosture.IGoal = {
            point: Vector3.subtract(
              at,
              StrikingBody.socket(
                body,
                side === "left" ? "fistLeft" : "fistRight",
                rotation,
              ),
            ),
            bend: Vector3.add(bones.get(`${side}UpperArm`)!.worldPosition, {
              x: 0,
              y: -m.upperArm,
              z: 0,
            }),
            rotation,
          };
          const from: IHumanPosture.IGoal = limbs[arm] ?? guard[arm] ?? goal;
          limbs[arm] = {
            point: Vector3.lerp(from.point, goal.point, k),
            bend: Vector3.lerp(from.bend, goal.bend, k),
            rotation: Quaternion.slerp(from.rotation ?? rotation, rotation, k),
          };
        }
        return { ...posture, limbs };
      },
    };
  }
}
