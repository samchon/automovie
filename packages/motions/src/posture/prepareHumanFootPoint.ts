import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanFootOffset } from "./humanFootOffset";

/** The alternatives of `PrepareHumanFootPointPoint`'s site. */
type PrepareHumanFootPointPoint = "heel" | "ball" | "toe" | "sole" | "mtp";

/**
 * Prepare a sole point whose body, socket and toe flexion remain fixed.
 *
 * @param body The socket's body.
 * @param side The foot.
 * @param point The socket to place.
 * @param toes Fixed toe flexion, degrees; zero when absent.
 * @returns A reader of foot placement yielding the same world point as
 *   `point`.
 */
export function prepareHumanFootPoint(
  body: humanFootOffset.IBody,
  side: AutoMovieHumanSide,
  point: PrepareHumanFootPointPoint,
  toes: number = 0,
): (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3 {
  const local: IAutoMovieVector3 = humanFootOffset(body, side, point, toes);
  return (foot: IAutoMovieMotionHumanFoot.IPlacement): IAutoMovieVector3 =>
    pointAt(local, foot);
}

/** The common ankle translation and rigid rotation of a prepared local socket. */
function pointAt(
  local: IAutoMovieVector3,
  foot: IAutoMovieMotionHumanFoot.IPlacement,
): IAutoMovieVector3 {
  return Vector3.add(
    foot.ankle,
    Quaternion.rotateVector(foot.rotation, local),
  );
}
