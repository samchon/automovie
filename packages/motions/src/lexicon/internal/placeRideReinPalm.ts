import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanHand } from "../../posture/internal/HumanHand";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";

/*
 * Seat a wrist-relative palm frame on a line's skin. The hand faces against the
 * line's outward normal, with its fingers across the line as the rider held
 * them when taking the rein, turned about the normal by the hold's crossing
 * angle when it has one. World positions and radius are in metres; the crossing
 * is in degrees.
 */
export function placeRideReinPalm(
  palm: IAutoMovieMotionHumanHand.IFrame,
  grip: IAutoMovieMotionHumanMountRider.IHoldGrip,
  fingers: IAutoMovieVector3,
  cross?: number,
): IAutoMovieMotionHumanHand.IWrist {
  const point: IAutoMovieVector3 = Vector3.addScaled(
    grip.point,
    grip.normal,
    grip.radius ?? 0,
  );
  const square: IAutoMovieQuaternion = HumanHand.align(palm, {
    normal: Vector3.scale(grip.normal, -1),
    forward: fingers,
  });
  // The line crosses the palm at the hold's own angle, a turn about the outward normal (`crossRideReinGrip`).
  const rotation: IAutoMovieQuaternion =
    cross === undefined
      ? square
      : Quaternion.normalize(
          Quaternion.multiply(
            Quaternion.fromAxisAngle(grip.normal, cross),
            square,
          ),
        );
  return placeHumanHandSurface(palm.point, point, rotation);
}
