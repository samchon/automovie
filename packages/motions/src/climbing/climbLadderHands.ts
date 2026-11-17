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
 * Prepare hand geometry while running every requested ladder bend solve.
 *
 * @param body The climb's unchanged body, profile, rig and ROM.
 * @param normal The fixed ladder's outward world normal.
 * @returns Fresh original grip goals from actual Bend sweeps; an explicit pair names fixed stationary-rung prerequisites, while an optional bilateral reader shares only one current write's trunk preparation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/normal, actual world point/posture, legal stationary-rung identity, optional synchronous bilateral loan and fresh arm-goal output; omitting both preparations retains the ordinary target/goal path.
 * @evidence contracts/development/implementation.md#principled-implementation The still standing base and first climb primitive make each stationary foot pair determine the same exact rootXYZ/yaw/pitch/roll. A private frozen copy fixes Bend.prepare's real geometry; alternatively one synchronous write's unchanged trunk supplies the genuine bilateral reader. Every changed wrist/rotation still runs the original complete legality/strain sweep and fallback hang.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Original target readers serve unprepared calls. Both explicit paths obtain the same hand frame/wrist before requesting the shared Bend owner and original fromWrist assembly; fixed-support contexts and write-local paired trunk geometry have separate owners.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a moving hand under two stationary feet supplies a fixed-support pair; moving feet never reuse that preparation. Both prepared paths call context.solve for every requested goal, with no stored elbow/goal or skipped numerical sweep, fallback, contact or bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each actually used body/side/support prepares chain/trunk geometry once; current-operation bilateral reads share one trunk preparation across original actual side solves. Every hand point retains the original bounded numerical sweep. Frame and grip-offset preparation are constant per side; improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One plan fixes standing base, ladder, measured body and all profile/rig/ROM data; a stationary pair proves its private root/heading snapshot is unchanged. Other intervals may borrow one current write's exact fixed trunk across actual side requests, otherwise retaining the raw path; no queried pose/result is a key.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns at most 2*(2*rungs+1) fixed-support contexts plus two hand frame/offset readers, released with the plan. An optional bilateral reader/context is borrowed only during this synchronous goal call and never enters those maps or returned goals; its write owns/releases current FK loans. No target/candidate/result/time history or external handle is retained.
 */
export function climbLadderHands(
  body: IHumanBody,
  normal: IAutoMovieVector3,
): (side: "left" | "right", posture: IHumanPosture, point: IAutoMovieVector3, support?: readonly [number, number], paired?: ReturnType<typeof AutoMovieMotionHumanBend.prepareBoth>) => IHumanPosture.IGoal {
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
  return (side: "left" | "right", posture: IHumanPosture, point: IAutoMovieVector3, support?: readonly [number, number], paired?: ReturnType<typeof AutoMovieMotionHumanBend.prepareBoth>): IHumanPosture.IGoal => {
    if (support === undefined && paired === undefined) return AutoMovieMotionHumanArm.goal(body, side, hands[side](posture, point));
    const frame: ReturnType<ReturnType<typeof HumanHandTarget.prepareFrame>> = frames[side](posture);
    const wrist: HumanHand.IWrist = frame.place(point);
    let context: ReturnType<typeof AutoMovieMotionHumanBend.prepare>;
    if (support === undefined) context = paired!(side);
    else {
      const key: string = `${support[0]}:${support[1]}`;
      const known: ReturnType<typeof AutoMovieMotionHumanBend.prepare> | undefined = contexts[side].get(key);
      if (known === undefined) {
        const fixed: AutoMovieMotionHumanBend.ISolve["posture"] = Object.freeze({
          root: Object.freeze({ ...posture.root }), yaw: posture.yaw, pitch: posture.pitch, roll: posture.roll,
        });
        context = AutoMovieMotionHumanBend.prepare({ body, posture: fixed, side });
        contexts[side].set(key, context);
      } else context = known;
    }
    const bend: IAutoMovieVector3 = context.solve({ point: wrist.point, rotation: frame.rotation, fallback: "hang" });
    const contact: IAutoMovieVector3 = contacts[side] ??= { ...HumanHand.offset(body, side, "grip", "relaxed").point };
    return AutoMovieMotionHumanArmTarget.fromWrist(wrist, { ...bend }, { ...contact });
  };
}
