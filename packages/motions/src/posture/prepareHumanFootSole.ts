import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/**
 * Prepare a flat-toed foot's ankle-local sole points for changing placements.
 *
 * @param body The unchanged canonical body owning rest joints and sole frames.
 * @param side The foot.
 * @returns Fresh world sole points in the original socket-then-outline order.
 */
export function prepareHumanFootSole(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
): (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[] {
  let sides:
    | Partial<
        Record<
          AutoMovieHumanSide,
          (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[]
        >
      >
    | undefined = CACHE.get(body);
  if (sides === undefined) {
    sides = {};
    CACHE.set(body, sides);
  }
  const known:
    | ((foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[])
    | undefined = sides[side];
  if (known !== undefined) return known;
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
          : Vector3.add(
              Vector3.subtract(body.rest.get(frame.bone)!, ankle),
              frame.point,
            ),
    ),
  ];
  const read: (
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ) => IAutoMovieVector3[] = (
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieVector3[] =>
    local.map(
      (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(foot.ankle, Quaternion.rotateVector(foot.rotation, point)),
    );
  sides[side] = read;
  return read;
}

/**
 * Intrinsic ankle-local geometry only, at most one reader for each side of a
 * weak body.
 */
const CACHE: WeakMap<
  IAutoMovieMotionHumanBody,
  Partial<
    Record<
      AutoMovieHumanSide,
      (foot: IAutoMovieMotionHumanFoot.IPlacement) => IAutoMovieVector3[]
    >
  >
> = new WeakMap();
