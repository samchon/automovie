import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

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
   * The stairs as an author describes them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and default.
   * @evidence contracts/development/design.md#principled-representation The flight's architecture.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by `flight`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers and one closed union.
   */
  export interface IStairs {
    /** How many treads. */
    count: number;

    /** Each riser's height, metres; 0.17 when absent. */
    riser?: number;

    /** Each tread's depth, metres; 0.28 when absent. */
    tread?: number;

    /** Up the flight or down it; `up` when absent. */
    direction?: "up" | "down";

    /** The first nosing's distance ahead of the toes, metres; 0.05 when absent. */
    start?: number;
  }

  /**
   * The flight's surface height under a point, in the performer's floor
   * frame at the start (`z` forward from the toes' middle).
   *
   * @param flight The flight.
   * @param z Metres forward in that frame.
   * @returns The height of the floor, tread or landing there, metres.
   */
  export function surface(flight: IFlight, z: number): number {
    const sign: number = flight.direction === "up" ? 1 : -1;
    if (z < flight.first) return 0;
    const index: number = Math.min(
      flight.count,
      Math.floor((z - flight.first) / flight.tread) + 1,
    );
    return sign * index * flight.riser;
  }

  /**
   * A flight as the plan resolved it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The flight in the performer's starting floor frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `surface` and the capture.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Plain numbers.
   */
  export interface IFlight {
    /** The frame: origin on the floor under the feet's middle, the heading. */
    frame: HumanFrame.IFrame;

    /** The first nosing's distance ahead in that frame, metres. */
    first: number;

    /** Treads. */
    count: number;

    /** Riser, metres. */
    riser: number;

    /** Tread, metres. */
    tread: number;

    /** Up or down. */
    direction: "up" | "down";
  }

  /**
   * The flight a set of parameters describes for a performer standing as
   * its entry has it.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param params The parameters.
   * @returns The flight.
   * @throws {Error} When the count is not a positive integer, or the riser or the tread is outside what the body can climb.
   */
  export function flight(
    body: IHumanBody,
    posture: IHumanPosture,
    params: IStairs,
  ): IFlight {
    const m = body.measure;
    const riser: number = params.riser ?? 0.17;
    const tread: number = params.tread ?? 0.28;
    if (!(Number.isInteger(params.count) && params.count > 0))
      throw new Error("A flight has a positive whole number of treads");
    if (!(riser > 0 && riser <= 0.35 * m.hipHeight))
      throw new Error(
        `A riser of ${riser.toFixed(3)} m lies outside the 0 to ${(0.35 * m.hipHeight).toFixed(3)} m this body climbs`,
      );
    if (!(tread >= 0.6 * m.footLength))
      throw new Error(
        `A tread of ${tread.toFixed(3)} m is shorter than the ${(0.6 * m.footLength).toFixed(3)} m this body's foot needs`,
      );
    const yaw: number = posture.yaw;
    const feet = (["left", "right"] as const).map((side) => {
      const goal: IHumanPosture.IGoal = posture.limbs[`${side}Leg`]!;
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
    const frame: HumanFrame.IFrame = { origin, yaw };
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
