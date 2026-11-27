import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbStairsFlight,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import type { humanFootOffset } from "../../posture/internal/humanFootOffset";

/** The measurements and toe sockets used to resolve a flight. */
type FlightBody = humanFootOffset.IBody & {
  /** The body's reach and support scale, metres. */
  measure: Pick<IAutoMovieMotionHumanBody["measure"], "hipHeight" | "footLength">;
};

/** The record of `IFlightToeF`'s site. */
type IFlightToeF = { ankle: IAutoMovieVector3; toe: IAutoMovieVector3 };

/** The record of `IFlightFeetResult`'s site. */
type IFlightFeetResult = { ankle: IAutoMovieVector3; toe: IAutoMovieVector3 };

/** The record of `IFlightFeetItem`'s site. */
type IFlightFeetItem = { ankle: IAutoMovieVector3; toe: IAutoMovieVector3 };

/**
 * The flight of stairs a climb is planned on: its shape as the author gives it,
 * the flight resolved in the performer's starting floor frame, and the surface
 * height under a point. Read by the climb's plan (`climbStairs`) and by the
 * capture that checks soles against the treads.
 */
export namespace climbStairsFlight {
  /**
   * The first nosing's distance ahead of the toes when the author gives none,
   * metres (provisional).
   */
  export const START: number = 0.05;

  /**
   * The flight's surface height under a point, in the performer's floor frame
   * at the start (`z` forward from the toes' middle).
   *
   * @param flight The flight.
   * @param z Metres forward in that frame.
   * @returns The height of the floor, tread or landing there, metres.
   */
  export function surface(
    flight: IAutoMovieMotionHumanClimbStairsFlight.IFlight,
    z: number,
  ): number {
    return surfaceAt(
      flight.direction === "up" ? 1 : -1,
      flight.first,
      flight.count,
      flight.tread,
      flight.riser,
      z,
    );
  }

  /**
   * Prepare one unchanged flight's surface for clearance-path probes.
   *
   * @param flight The fixed resolved stair geometry in its own floor frame.
   * @returns The same height in metres at each forward local z in metres.
   */
  export function prepareSurface(
    flight: IAutoMovieMotionHumanClimbStairsFlight.IFlight,
  ): (z: number) => number {
    const sign: number = flight.direction === "up" ? 1 : -1;
    const first: number = flight.first;
    const count: number = flight.count;
    const tread: number = flight.tread;
    const riser: number = flight.riser;
    return (z: number): number =>
      surfaceAt(sign, first, count, tread, riser, z);
  }

  /**
   * The flight a set of parameters describes for a performer standing as its
   * entry has it.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param params The parameters.
   * @returns The flight.
   * @throws {HumanRefusal} When the rounded count is below one, or when the
   *   riser or tread is outside what the body can climb.
   */
  export function flight(
    body: FlightBody,
    posture: Pick<IAutoMovieMotionHumanPosture, "yaw" | "limbs">,
    params: IAutoMovieMotionHumanClimbStairsFlight.IStairs,
  ): IAutoMovieMotionHumanClimbStairsFlight.IFlight {
    const m: FlightBody["measure"] = body.measure;
    const riser: number = params.riser ?? 0.17;
    const tread: number = params.tread ?? 0.28;
    const count: number = HumanBound.whole("count", params.count);
    HumanBound.within("riser", riser, 0, 0.35 * m.hipHeight, "m", "minimum");
    HumanBound.least("tread", tread, 0.6 * m.footLength, "m");
    const yaw: number = posture.yaw;
    const feet: IFlightFeetItem[] = (["left", "right"] as const).map(
      (side: AutoMovieHumanSide): IFlightFeetResult => {
        const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
        return {
          ankle: goal.point,
          toe: HumanFoot.point(body, side, "toe", {
            ankle: goal.point,
            rotation: goal.rotation ?? HumanFrame.turn(yaw),
          }),
        };
      },
    );
    const origin: IAutoMovieVector3 = {
      x: (feet[0]!.ankle.x + feet[1]!.ankle.x) / 2,
      y: 0,
      z: (feet[0]!.ankle.z + feet[1]!.ankle.z) / 2,
    };
    const frame: IAutoMovieMotionHumanFrame = { origin, yaw };
    const toe: number = Math.max(
      ...feet.map((f: IFlightToeF): number => HumanFrame.local(frame, f.toe).z),
    );
    return {
      frame,
      first: toe + (params.start ?? START),
      count,
      riser,
      tread,
      direction: params.direction ?? "up",
    };
  }
}

/** The original architectural stepped surface, shared by raw and prepared reads. */
function surfaceAt(
  sign: number,
  first: number,
  count: number,
  tread: number,
  riser: number,
  z: number,
): number {
  if (z < first) return 0;
  const index: number = Math.min(count, Math.floor((z - first) / tread) + 1);
  return sign * index * riser;
}
