import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import type { walkFoot } from "./walkFoot";

/**
 * The stationary sole point a swing departs from (`walkFoot.prepareSwing`): the
 * lowest of the heel, ball and toe sockets in the swing's authored release
 * posture, the heel when they tie.
 *
 * @param body The body.
 * @param side The swinging foot.
 * @param from The foot's stance at release.
 * @returns The lowest socket and its world point, metres.
 */
export function walkFootTakeoff(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  from: walkFoot.IEnd,
): walkFootTakeoff.IDeparture {
  const anchor: walkFootTakeoff.IDeparture = {
    socket: "heel",
    point: HumanFoot.point(body, side, "heel", from),
  };
  for (const socket of ["ball", "toe"] as const) {
    const point: IAutoMovieVector3 = HumanFoot.point(
      body,
      side,
      socket,
      from,
      from.toes,
    );
    if (point.y < anchor.point.y) {
      anchor.socket = socket;
      anchor.point = point;
    }
  }
  return anchor;
}

/** The departure a swing reads. */
export namespace walkFootTakeoff {
  /** The actual lowest authored sole socket and its starting position. */
  export interface IDeparture {
    /** The socket. */
    socket: IAutoMovieMotionHumanFoot.Socket;

    /** Its world point at release, metres. */
    point: IAutoMovieVector3;
  }
}
