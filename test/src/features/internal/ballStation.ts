import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBallPlay,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";

import type { IBallStation } from "./IBallStation";

/**
 * Where a receiver stands to take a launched ball: the point the flight
 * crosses a vertical plane through `through`, square to the flight's
 * horizontal direction, with the receiver 0.46 m beyond it facing back
 * along that direction, as the staged-catch fixture places its receiver.
 *
 * @param film A take containing the launch; later actors must not change this flight.
 * @param ball The ball subject.
 * @param launch The launch to receive, read from the take's play.
 * @param through A point on the receiving plane, world metres.
 * @param centre The ball centre in the ball's frame.
 * @returns The receiver's floor position, yaw in degrees, the intercept in seconds after the launch and the crossing.
 * @throws {Error} When the flight never reaches the plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the plane, the standing offset, the yaw convention and the precondition on later actors.
 * @evidence contracts/development/implementation.md#principled-implementation A catch is staged where the actual flight already is; the 0.46 m stand-off is the staged-catch fixture's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One station rule shared by the sport play tests.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the displayed flight through HumanBallPlay.crossing; no trajectory is recomputed here.
 * @evidence contracts/development/implementation.md#efficient-algorithms One gate scan of the take from the launch to its end.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record.
 */
export function ballStation(
  film: AutoMovieMotionHumanPerformance,
  ball: string,
  launch: IAutoMovieMotionHumanBallPlay.ILaunch,
  through: IAutoMovieVector3,
  centre: IAutoMovieVector3,
): IBallStation {
  const away: IAutoMovieVector3 = Vector3.normalize({
    ...launch.velocity,
    y: 0,
  });
  const crossing: IAutoMovieMotionHumanBallPlay.ICrossing | undefined =
    AutoMovieMotionHumanThrowCatch.HumanBallPlay.crossing(
      film,
      ball,
      {
        kind: "rectangle",
        centre: through,
        normal: away,
        up: { x: 0, y: 1, z: 0 },
        halfWidth: 50,
        halfHeight: 50,
      },
      launch.seconds,
      film.duration,
      centre,
    );
  if (crossing === undefined)
    throw new Error(`The ${launch.subject} launch never reaches its receiver`);
  return {
    at: { ...Vector3.add(crossing.point, Vector3.scale(away, 0.46)), y: 0 },
    yaw: (Math.atan2(-away.x, -away.z) * 180) / Math.PI,
    intercept: crossing.seconds - launch.seconds,
    crossing,
  };
}
