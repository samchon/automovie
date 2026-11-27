import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";

/*
 * The side of each grip's axis the fingers close over, chosen once where a
 * ride's hold begins (`HumanRideHands`): the sign of the axis crossed with the
 * grip's outward normal against the rider's forward, so the fingers wrap the
 * grip on the side the body faces and keep that side afterwards. A sign
 * re-taken at every second could flip the hand on an oar.
 * Parameter grips: Each holding hand's grip where the hold begins.
 * Parameter seated: The seated posture the hold begins from.
 * Returns: Each holding hand's side, for the grips that have an axis.
 */
export function sideRideGrips(
  grips: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanMountRider.IHoldGrip>
  >,
  seated: IAutoMovieMotionHumanPosture,
): Partial<
  Record<
    AutoMovieHumanSide,
    NonNullable<IAutoMovieMotionHumanMountRider.IHoldGrip["across"]>
  >
> {
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    humanPostureHeading(seated),
    { x: 0, y: 0, z: 1 },
  );
  const sides: Partial<
    Record<
      AutoMovieHumanSide,
      NonNullable<IAutoMovieMotionHumanMountRider.IHoldGrip["across"]>
    >
  > = {};
  for (const side of ["left", "right"] as const) {
    const grip: IAutoMovieMotionHumanMountRider.IHoldGrip | undefined =
      grips[side];
    if (grip?.axis === undefined) continue;
    sides[side] =
      Vector3.dot(Vector3.cross(grip.axis, grip.normal), forward) < 0 ? -1 : 1;
  }
  return sides;
}
