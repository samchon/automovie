import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Prepare a ladder's hand goals, sharing bend geometry only on a fixed support.
 *
 * @param body The climb's unchanged body, profile, rig and ROM.
 * @param normal The fixed ladder's outward world normal.
 * @returns Fresh original grip goals; an explicit pair names the legal stationary foot rungs whose first support primitive fixes the exact root/heading throughout a moving hand's beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/normal, actual world point and posture, legal stationary-rung identity and fresh arm-goal output; omission retains the ordinary target/goal path.
 * @evidence contracts/development/implementation.md#principled-implementation The still standing base and first climb primitive make each stationary foot pair determine the same exact rootXYZ/yaw/pitch/roll. A private frozen copy fixes Bend.prepare's real chain/trunk geometry; each changed wrist/rotation still runs the original complete legality/strain sweep and fallback hang.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Original target readers serve moving-foot and one-shot goals; the explicit fixed-support path obtains the same prepared hand frame/wrist, runs the shared Bend owner and uses the original fromWrist assembly.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only climbLadder's moving hand under two stationary feet supplies a pair; moving feet never reuse it. No target, candidate, sweep, fallback, contact, shape or goal is replaced, sampled or rounded.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each actually used body/side/support prepares chain/trunk geometry once while every hand point retains the original bounded numerical solve. Frame and grip-offset preparation are constant per side; improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One plan fixes standing base, ladder, measured body and all profile/rig/ROM data; the caller's stationary pair proves its private root/heading snapshot is unchanged. Every other interval uses the raw path, and no queried pose/result is a key.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources This plan owns at most 2*(2*rungs+1) contexts, linear in authored rungs times chain/trunk-profile geometry, plus two hand frame/offset readers. Contexts retain immutable geometry rather than FK loans, targets, candidates or time history and release with the plan or failed construction; no handle or task is acquired.
 */
export function climbLadderHands(
  body: IHumanBody,
  normal: IAutoMovieVector3,
): (side: "left" | "right", posture: IHumanPosture, point: IAutoMovieVector3, support?: readonly [number, number]) => IHumanPosture.IGoal {
  const hands: Record<"left" | "right", ReturnType<typeof AutoMovieMotionHumanTarget.prepareHand>> = {
    left: AutoMovieMotionHumanTarget.prepareHand(body, "left", normal, { surface: "grip", shape: "relaxed", curl: 50 }),
    right: AutoMovieMotionHumanTarget.prepareHand(body, "right", normal, { surface: "grip", shape: "relaxed", curl: 50 }),
  };
  const frames: Record<"left" | "right", ReturnType<typeof HumanHandTarget.prepareFrame>> = {
    left: HumanHandTarget.prepareFrame(body, "left", normal, { surface: "grip", shape: "relaxed" }),
    right: HumanHandTarget.prepareFrame(body, "right", normal, { surface: "grip", shape: "relaxed" }),
  };
  const contexts: Record<"left" | "right", Map<string, ReturnType<typeof AutoMovieMotionHumanBend.prepare>>> = { left: new Map(), right: new Map() };
  const contacts: Partial<Record<"left" | "right", IAutoMovieVector3>> = {};
  return (side: "left" | "right", posture: IHumanPosture, point: IAutoMovieVector3, support?: readonly [number, number]): IHumanPosture.IGoal => {
    if (support === undefined) return AutoMovieMotionHumanArm.goal(body, side, hands[side](posture, point));
    const frame: ReturnType<ReturnType<typeof HumanHandTarget.prepareFrame>> = frames[side](posture);
    const wrist: HumanHand.IWrist = frame.place(point);
    const key: string = `${support[0]}:${support[1]}`;
    let context: ReturnType<typeof AutoMovieMotionHumanBend.prepare> | undefined = contexts[side].get(key);
    if (context === undefined) {
      const fixed: AutoMovieMotionHumanBend.ISolve["posture"] = Object.freeze({
        root: Object.freeze({ ...posture.root }), yaw: posture.yaw, pitch: posture.pitch, roll: posture.roll,
      });
      context = AutoMovieMotionHumanBend.prepare({ body, posture: fixed, side });
      contexts[side].set(key, context);
    }
    const bend: IAutoMovieVector3 = context.solve({ point: wrist.point, rotation: frame.rotation, fallback: "hang" });
    const contact: IAutoMovieVector3 = contacts[side] ??= { ...HumanHand.offset(body, side, "grip", "relaxed").point };
    return AutoMovieMotionHumanArmTarget.fromWrist(wrist, { ...bend }, { ...contact });
  };
}
