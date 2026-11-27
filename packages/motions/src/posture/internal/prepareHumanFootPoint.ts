import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanFootOffset } from "./humanFootOffset";

/*
 * Prepare a sole point whose body, socket and toe flexion remain fixed.
 * Parameter body: The socket's body.
 * Parameter side: The foot.
 * Parameter point: The socket to place.
 * Parameter toes: Fixed toe flexion, degrees; zero when absent.
 * Returns: A reader of foot placement yielding the same world point as `point`.
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

/*
 * The alternatives of `PrepareHumanFootPointPoint`'s site.
 */
type PrepareHumanFootPointPoint = "heel" | "ball" | "toe" | "sole" | "mtp";

/*
 * The common ankle translation and rigid rotation of a prepared local socket.
 */
function pointAt(
  local: IAutoMovieVector3,
  foot: IAutoMovieMotionHumanFoot.IPlacement,
): IAutoMovieVector3 {
  return Vector3.add(foot.ankle, Quaternion.rotateVector(foot.rotation, local));
}
