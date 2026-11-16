import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { IWalkGait } from "./IWalkGait";
import { stand } from "./stand";
import { standUpright } from "./standUpright";
import type { walkFoot } from "./walkFoot";
import { walkReach } from "./walkReach";
import type { walkSteps } from "./walkSteps";

/** The settled feet and pelvis the gait's posture reads at one second. */
interface ISettled {
  feet: Record<"left" | "right", walkFoot.IScheduled>;
  hips: readonly [number, number, number];
  settled: walkReach.IGround;
  reached: Record<"left" | "right", walkFoot.IEnd>;
}

/**
 * Prepare one stepping take's standing alignment and assemble its posture
 * before arm carriage, writing only requested leg goals.
 *
 * @param body The take's fixed body.
 * @param gait Its trunk lean and arm geometry.
 * @param arms The authored and manner-scaled arm swing multiplier.
 * @param elbows The authored added shoulder abduction, degrees.
 * @param steps The take's fixed step clock and phase readers.
 * @param solve The take's same-second pelvis and requested-foot solve.
 * @returns A clamped action-second reader; omitted leg demand writes both legs.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body preparation, arm units, action time and the optional leg demand.
 * @evidence contracts/development/implementation.md#principled-implementation Preserves the gait's sinusoidal pelvic/chest counter-rotation, arm angles, upright-relative lumbopelvic inclination and footprint-heading knee hints, then pivots the trunk about the hips.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Standing alignment, relaxed joints and lower-leg rest points are prepared once before the single posture reader; foot reach remains with the supplied solve owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No gait parameter, contact, joint angle or root formula changes; unread leg goals are omitted only under explicit channel demand.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant body preparation and constant-size posture assembly per second; the supplied solve computes only requested swinging feet, with at most two leg goals written.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One take fixes the body, gait, arm modifiers and step plan, so their standing alignment and bone rest points remain valid for every queried second.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned reader owns fixed body/step references and standing terms until its plan releases it, without a sample history or external handle.
 */
export function walkPosture(
  body: IHumanBody,
  gait: IWalkGait,
  arms: number,
  elbows: number,
  steps: walkSteps.IPlan,
  solve: (seconds: number, legs: readonly ("left" | "right")[]) => ISettled,
): (seconds: number, legs?: readonly ("left" | "right")[]) => IHumanPosture {
  const upright: standUpright.IAlignment = standUpright.of(body);
  const relaxed: IHumanPosture["joints"] = stand.relaxed(body);
  const abduction: number = stand.abduction(body) + elbows;
  const rest: Record<"left" | "right", IAutoMovieVector3> = {
    left: body.rest.get("leftLowerLeg")!,
    right: body.rest.get("rightLowerLeg")!,
  };
  return (
    seconds: number,
    legs: readonly ("left" | "right")[] = walkReach.SIDES,
  ): IHumanPosture => {
    const t: number = Math.min(steps.duration, Math.max(0, seconds));
    const phase: number = steps.phase(t);
    const amount: number = steps.amount(t);
    const swing: number = Math.sin(2 * Math.PI * phase) * amount;
    const { feet, hips, settled, reached }: ISettled = solve(t, legs);
    const root: IAutoMovieVector3 = settled.root;
    const yaw: number = settled.yaw;

    // The inclination grows and fades with the gait, leaving and joining
    // upright standing while its pelvis share turns about the fixed hips.
    const inclined: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      upright.joints, gait.lean * amount,
    );
    const joints: IHumanPosture["joints"] = {
      ...relaxed,
      ...inclined.joints,
      hips,
      leftToes: [reached.left.toes, 0, 0],
      rightToes: [reached.right.toes, 0, 0],
      chest: [inclined.joints.chest?.[0] ?? 0, 0, -4 * swing],
      leftUpperArm: [-gait.arms.shoulder * arms * swing, abduction, 0],
      rightUpperArm: [gait.arms.shoulder * arms * swing, abduction, 0],
      leftLowerArm: [gait.arms.elbow - gait.arms.swing * arms * swing, 0, 0],
      rightLowerArm: [gait.arms.elbow + gait.arms.swing * arms * swing, 0, 0],
    };
    const limbs: IHumanPosture["limbs"] = {};
    for (const side of legs) {
      const planted: boolean = feet[side].swing === undefined;

      // The foot has no axial joint: its own heading carries the knee's
      // bend hint even when a folded shank pitches it past vertical.
      const knee: IAutoMovieVector3 = HumanFrame.point(
        {
          origin: HumanFrame.point({ origin: root, yaw }, rest[side]),
          yaw: HumanFoot.heading(reached[side].rotation),
        },
        { x: 0, y: 0, z: 1 },
      );
      limbs[`${side}Leg`] = {
        point: reached[side].ankle,
        bend: knee,
        rotation: reached[side].rotation,
        ...(planted ? { planted: true, contact: settled.contacts[side] } : {}),
      };
    }
    return AutoMovieMotionHumanLean.pivot(
      body,
      { root, yaw, pitch: 0, roll: 0, joints, limbs },
      { pitch: inclined.pitch, roll: 0 },
    );
  };
}
