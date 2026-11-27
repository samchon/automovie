import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/*
 * Prepare a flat-toed foot's ankle-local sole points for changing placements.
 * Parameter body: The unchanged canonical body owning rest joints and sole frames.
 * Parameter side: The foot.
 * Returns: Fresh world sole points in the original socket-then-outline order.
 */
export function prepareHumanFootSole(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[] {
  const ankle: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
  const local: IAutoMovieVector3[] = [
    ...HumanFoot.SOCKETS.map(
      (socket: IAutoMovieMotionHumanFoot.Socket): IAutoMovieVector3 =>
        HumanFoot.offset(body, side, socket),
    ),
    ...HumanFoot.outline(body, side).map(
      (frame: IAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
        frame.bone === `${side}Foot`
          ? frame.point
          : AutoMovieEngineVector3.add(
              AutoMovieEngineVector3.subtract(body.rest.get(frame.bone)!, ankle),
              frame.point,
            ),
    ),
  ];
  return (
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieVector3[] =>
    local.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        AutoMovieEngineVector3.add(foot.ankle, AutoMovieEngineQuaternion.rotateVector(foot.rotation, point)),
    );
}

