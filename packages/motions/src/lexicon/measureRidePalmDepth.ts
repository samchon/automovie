import {
  type AutoMovieHumanoidSurfaceRays,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanMountRider } from "./HumanMountRider";

/**
 * How deep a hand's palm skin lies below its palm socket at the station a holding hand closes on: `HumanMountRider.CENTRE` hand lengths along the fingers from the palm socket, measured along the palm's normal to the body's own skin. A ride's round articulated handle is held at this depth (`HumanRideHands`).
 *
 * @param body The body.
 * @param side The hand.
 * @param surfaces The body's surface rays at rest, built once by the caller.
 * @returns The depth, metres.
 */
export function measureRidePalmDepth(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  surfaces: ReturnType<typeof AutoMovieHumanoidSurfaceRays.tools>,
): number {
  const palm: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"];
  const bone: IAutoMovieResolvedBone = surfaces.at(palm.bone);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    bone.worldRotation,
    palm.normal,
  );
  const fingers: IAutoMovieVector3 = Quaternion.rotateVector(
    bone.worldRotation,
    palm.forward!,
  );
  const station: IAutoMovieVector3 = Vector3.add(
    bone.worldPosition,
    Vector3.scale(fingers, HumanMountRider.CENTRE * body.measure.hand),
  );
  const skin: IAutoMovieVector3 = surfaces.exit(palm.bone, station, normal);
  return Vector3.dot(Vector3.subtract(skin, station), normal);
}
