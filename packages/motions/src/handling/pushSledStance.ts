import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The stance a sled push (`pushSled`) takes its handles from: how far the
 * trunk inclines into the load, hinging at the hips, and how far the body
 * sinks onto bent knees, both read from where the handles are.
 *
 * Lower handles are pushed with the trunk nearer the horizontal (coaching
 * descriptions give a hip bend of about 45 to 90 degrees, lower hands more
 * horizontal: Inspire USA Foundation and Rep Fitness's sled push guides,
 * provisional until a measured study is found): the trunk hinges from the
 * push's lean, in `STEP`s up to `RANGE`, until each wrist's reach across the
 * floor lies within `SHORT` of the arm's full reach from its shoulder; the
 * body then sinks as far as keeps it so, room for the gait's rise and fall.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is solved, from what, by which rule and its sources.
 * @evidence contracts/development/design.md#principled-representation The stance is an incline in degrees from the vertical and a sink in metres, the two values `AutoMovieMotionHumanTrunk.sunk` takes.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The three constants, the stance and its solver, read by `pushSled` alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No sled is named; the handles are the frames the law reads.
 */
export namespace pushSledStance {
  /** The steepest the trunk inclines into a push, degrees from the vertical: the coaching guides' 90-degree hip bend (provisional). */
  export const RANGE: number = 90;

  /** The step the trunk's incline is tried in, degrees. */
  export const STEP: number = 5;

  /** The share of the arm's full reach a pushing wrist is kept within, from its shoulder (provisional: the elbows a little bent, room for the gait's rise and fall). */
  export const SHORT: number = 0.9;

  /** The trunk's incline from the vertical, degrees, and the body's sink onto bent knees, metres. */
  export interface IStance {
    /** Degrees from the vertical, from the push's lean to `RANGE`. */
    incline: number;

    /** Metres, not negative. */
    sink: number;
  }

  /**
   * Solve the stance.
   *
   * @param body The body.
   * @param standing The body where it takes the handles, before it leans.
   * @param handles Each hand's handle frame.
   * @param lean The least incline, degrees from the vertical.
   * @returns The stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each wrist is placed by its grasp (`HumanHand.reach`); the shoulders are read off the resolved leaned body; the sink is the drop that brings the shoulder within `SHORT` of the reach for the floor distance it keeps, by Pythagoras.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The incline loop, then one sink pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The incline stops at `RANGE` and the sink only lowers the shoulders; a handle still beyond reach is the law's refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most (`RANGE` minus the lean) over `STEP` plus two posture resolutions.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function solved(
    body: IHumanBody,
    standing: IHumanPosture,
    handles: Record<HumanHand.Side, HumanHand.IFrame>,
    lean: number,
  ): IStance {
    const short: number =
      SHORT * (body.measure.upperArm + body.measure.forearm);
    const asked: Record<HumanHand.Side, IAutoMovieVector3> = {
      left: HumanHand.reach(body, "left", "grip", handles.left, "fist").point,
      right: HumanHand.reach(body, "right", "grip", handles.right, "fist")
        .point,
    };
    const shoulders = (
      incline: number,
    ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(
        body,
        resolveHumanPosture(
          body,
          AutoMovieMotionHumanTrunk.sunk(body, standing, 0, incline, 0),
        ),
      );
    const across = (
      bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
      side: HumanHand.Side,
    ): number => {
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      return Math.hypot(
        asked[side].x - shoulder.x,
        asked[side].z - shoulder.z,
      );
    };

    let incline: number = lean;
    for (; incline < RANGE; incline = Math.min(RANGE, incline + STEP)) {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        shoulders(incline);
      if (across(bones, "left") < short && across(bones, "right") < short)
        break;
    }

    let sink: number = 0;
    const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      shoulders(incline);
    for (const side of ["left", "right"] as const) {
      const shoulder: IAutoMovieVector3 = bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const flat: number = across(bones, side);
      if (flat < short)
        sink = Math.max(
          sink,
          shoulder.y - asked[side].y - Math.sqrt(short * short - flat * flat),
        );
    }
    return { incline, sink };
  }
}
