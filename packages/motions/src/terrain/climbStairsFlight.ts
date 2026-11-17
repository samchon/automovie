import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanClimbStairsFlight, IAutoMovieMotionHumanFrame, IAutoMovieMotionHumanPosture, IAutoMovieVector3 } from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";

/**
 * The flight of stairs a climb is planned on: its shape as the author gives
 * it, the flight resolved in the performer's starting floor frame, and the
 * surface height under a point. Read by the climb's plan (`climbStairs`) and
 * by the capture that checks soles against the treads.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the namespace holds and its two readers.
 * @evidence contracts/development/design.md#principled-representation A flight is a first nosing, a count, a riser and a tread in one floor frame, the architectural description of a stair.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two records and two functions, all read by the plan or the capture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No footprint is typed; the frame follows from the standing feet.
 * @evidence contracts/development/implementation.md#principled-implementation The first nosing is measured from the standing toes, so the flight starts where the performer stands.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One validation, one frame and one stepped height function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A riser or tread the body cannot climb throws with the bound it broke.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace climbStairsFlight {

  /**
   * The flight's surface height under a point, in the performer's floor
   * frame at the start (`z` forward from the toes' middle).
   *
   * @param flight The flight.
   * @param z Metres forward in that frame.
   * @returns The height of the floor, tread or landing there, metres.
   */
  export function surface(flight: IAutoMovieMotionHumanClimbStairsFlight.IFlight, z: number): number {
    const sign: number = flight.direction === "up" ? 1 : -1;
    if (z < flight.first) return 0;
    const index: number = Math.min(
      flight.count,
      Math.floor((z - flight.first) / flight.tread) + 1,
    );
    return sign * index * flight.riser;
  }

  /**
   * The flight a set of parameters describes for a performer standing as
   * its entry has it.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param params The parameters.
   * @returns The flight.
   * @throws {HumanRefusal} When the count is not a positive integer, or the riser or the tread is outside what the body can climb.
   */
  export function flight(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    params: IAutoMovieMotionHumanClimbStairsFlight.IStairs,
  ): IAutoMovieMotionHumanClimbStairsFlight.IFlight {
    const m = body.measure;
    const riser: number = params.riser ?? 0.17;
    const tread: number = params.tread ?? 0.28;
    HumanBound.whole("count", params.count);
    HumanBound.within("riser", riser, 0, 0.35 * m.hipHeight, "m", "minimum");
    HumanBound.least("tread", tread, 0.6 * m.footLength, "m");
    const yaw: number = posture.yaw;
    const feet = (["left", "right"] as const).map((side) => {
      const goal: IAutoMovieMotionHumanPosture.IGoal = posture.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        toe: HumanFoot.point(body, side, "toe", {
          ankle: goal.point,
          rotation: goal.rotation ?? HumanFrame.turn(yaw),
        }),
      };
    });
    const origin: IAutoMovieVector3 = {
      x: (feet[0]!.ankle.x + feet[1]!.ankle.x) / 2,
      y: 0,
      z: (feet[0]!.ankle.z + feet[1]!.ankle.z) / 2,
    };
    const frame: IAutoMovieMotionHumanFrame.IFrame = { origin, yaw };
    const toe: number = Math.max(
      ...feet.map((f) => HumanFrame.local(frame, f.toe).z),
    );
    return {
      frame,
      first: toe + (params.start ?? 0.05),
      count: params.count,
      riser,
      tread,
      direction: params.direction ?? "up",
    };
  }
}
