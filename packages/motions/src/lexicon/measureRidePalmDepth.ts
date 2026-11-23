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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the station, the measured depth and its consumer.
 * @evidence contracts/development/implementation.md#principled-implementation A ray from the station along the palm's normal leaves the palm bone's own skin; the depth is that exit's distance along the normal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Kept apart from the ride's hands so that owner stays within its size; one socket, one station, one ray.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The depth is measured on the body's own skin, not assumed.
 * @evidence contracts/development/implementation.md#efficient-algorithms One ray against the palm bone's surface.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller builds the surface rays once and keeps each hand's depth.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
