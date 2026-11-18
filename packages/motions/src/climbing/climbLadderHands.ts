import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandTarget } from "../posture/HumanHandTarget";

/**
 * Prepare hand geometry while running every requested ladder bend solve.
 *
 * @param body The climb's unchanged body, profile, rig and ROM.
 * @param normal The fixed ladder's outward world normal.
 * @returns Fresh grip goals from Bend sweeps; the bend source either names the two stationary feet's rungs, whose fixed root the reader prepares once, or lends one write's bilateral trunk preparation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the fixed body/normal, the world point and posture, the two bend sources and the fresh arm-goal output.
 * @evidence contracts/development/implementation.md#principled-implementation The still standing base and first climb primitive make each stationary foot pair determine the same root position, yaw, pitch and roll, so a frozen copy of that root fixes Bend.prepare's geometry for the pair; otherwise one write's trunk supplies the bilateral reader. Every wrist and rotation runs the complete legality/strain sweep and fallback hang.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Both sources obtain the same hand frame and wrist before the shared Bend owner and fromWrist assembly; the source union keeps the fixed-support contexts and write-local trunk geometry apart.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a moving hand under two stationary feet supplies a fixed-support pair; moving feet never reuse that preparation. Both sources call context.solve for every requested goal, with no stored elbow/goal or skipped sweep, fallback, contact or bound.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each used side/support pair prepares chain/trunk geometry once; a write's bilateral reads share one trunk preparation across both sides. Every hand point keeps its bounded numerical sweep. Frame and grip-offset preparation are constant per side; improvement is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One plan fixes standing base, ladder, measured body and all profile/rig/ROM data; a stationary pair proves its root/heading snapshot is the same. No queried pose or result is a key.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns at most 2*(2*rungs+1) fixed-support contexts plus two hand frame/offset readers, released with the plan. A lent bilateral reader is used only during this synchronous goal call and never enters those maps or returned goals; its write owns and releases its FK loans. No target, candidate, result or time history is retained.
 */
export function climbLadderHands(
  body: IAutoMovieMotionHumanBody,
  normal: IAutoMovieVector3,
): (side: "left" | "right", posture: IAutoMovieMotionHumanPosture, point: IAutoMovieVector3, source: IBendSource) => IAutoMovieHumanLimbGoal {
  const frames: Record<"left" | "right", ReturnType<typeof HumanHandTarget.prepareFrame>> = {
    left: HumanHandTarget.prepareFrame(body, "left", normal, { surface: "grip", shape: "relaxed" }),
    right: HumanHandTarget.prepareFrame(body, "right", normal, { surface: "grip", shape: "relaxed" }),
  };
  const contexts: Record<"left" | "right", Map<string, ReturnType<typeof AutoMovieMotionHumanBend.prepare>>> = { left: new Map(), right: new Map() };
  const contacts: Partial<Record<"left" | "right", IAutoMovieVector3>> = {};
  return (side: "left" | "right", posture: IAutoMovieMotionHumanPosture, point: IAutoMovieVector3, source: IBendSource): IAutoMovieHumanLimbGoal => {
    const frame: ReturnType<ReturnType<typeof HumanHandTarget.prepareFrame>> = frames[side](posture);
    const wrist: IAutoMovieMotionHumanHand.IWrist = frame.place(point);
    let context: ReturnType<typeof AutoMovieMotionHumanBend.prepare>;
    if (source.kind === "paired") context = source.paired(side);
    else {
      const key: string = `${source.support[0]}:${source.support[1]}`;
      const known: ReturnType<typeof AutoMovieMotionHumanBend.prepare> | undefined = contexts[side].get(key);
      if (known === undefined) {
        const fixed: IAutoMovieMotionHumanBend.ISolve["posture"] = Object.freeze({
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

/** Where a hand's bend solve takes its fixed trunk from: the two stationary feet's rungs, or one write's bilateral preparation. */
type IBendSource =
  | {
      /** A moving hand above two planted feet. */
      kind: "support";

      /** The left and right feet's rung indices. */
      support: readonly [number, number];
    }
  | {
      /** Any other instant. */
      kind: "paired";

      /** The current write's bilateral trunk preparation. */
      paired: ReturnType<typeof AutoMovieMotionHumanBend.prepareBoth>;
    };
