import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { AutoMovieEngineMotionTrajectory } from "./AutoMovieEngineMotionTrajectory";

/** The lateral unit axis, read without mutation by quaternion operations. */
const LATERAL: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };

/** The longitudinal unit axis in the shooting attitude convention. */
const LONGITUDINAL: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The forward unit axis in the shooting attitude convention. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The shooting attitude angles from an already inverted reference frame.
 *
 * For M = into q = Rx(phi) Rz(theta) Ry(psi), the long axis gives tilt and
 * somersault. Turning the lateral axis back through Rx(phi) Rz(theta) gives
 * twist. Somersault and twist are principal angles; tilt lies in [-pi/2, pi/2].
 * This is the existing takeoff chart, with its original clamped asin and its
 * Euler-chart singularity.
 *
 * @param into The inverse of the unit reference orientation.
 * @param q The unit body orientation in the reference's parent coordinates.
 * @returns Principal somersault, tilt and twist angles, radians.
 */
export function AirborneTakeoffAngles(
  into: IAutoMovieQuaternion,
  q: IAutoMovieQuaternion,
): IAutoMovieSolveAirborneTakeoff.IAngles {
  const m: IAutoMovieQuaternion = Quaternion.multiply(into, q);
  const long: IAutoMovieVector3 = Quaternion.rotateVector(m, LONGITUDINAL);
  const tilt: number = -Math.asin(Math.max(-1, Math.min(1, long.x)));
  const somersault: number = Math.atan2(long.z, long.y);
  const degrees: number = 180 / Math.PI;
  const back: IAutoMovieQuaternion = Quaternion.inverse(
    Quaternion.multiply(
      Quaternion.fromAxisAngle(LATERAL, somersault * degrees),
      Quaternion.fromAxisAngle(FORWARD, tilt * degrees),
    ),
  );
  const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.multiply(back, m),
    LATERAL,
  );
  return { somersault, tilt, twist: Math.atan2(-lateral.z, lateral.x) };
}

/** The shared angle chart's continuous branch reader. */
export namespace AirborneTakeoffAngles {
  /**
   * Accumulate whole turns on the same nearest-angle branches as the public
   * takeoff reader. A turn between observations must remain below pi radians.
   *
   * @param flight The actual solved numeric flight.
   * @param frame Unit reference orientation, inverted once for this pass.
   * @returns Unwrapped endpoint angles, radians.
   *
   *   States observations, units, reference ownership and winding premise. The
   *   nearest principal branch follows continuity under the stated pi bound.
   *   Invert once, read the existing chart, accumulate the two cyclic angles.
   *   Retains the original default-step observer without a new angle tolerance.
   *   Linear reads in flight duration over the original observation step. Both
   *   public and shooting paths share this unchanged branch calculation. Only
   *   current numeric angles survive each read; no history is retained.
   */
  export function unwrapped(
    flight: IAutoMovieIntegrateAirborneRotation.IFlight,
    frame: IAutoMovieQuaternion,
  ): IAutoMovieSolveAirborneTakeoff.IAngles {
    const into: IAutoMovieQuaternion = Quaternion.inverse(frame);
    let somersault: number = 0;
    let twist: number = 0;
    let tilt: number = 0;
    const step: number = AutoMovieEngineMotionTrajectory.integrateMotionTrajectoryStep();
    const count: number = Math.ceil((flight.t1 - flight.t0) / step) + 1;
    for (let k: number = 0; k < count; k++) {
      const seconds: number =
        k === count - 1 ? flight.t1 : flight.t0 + k * step;
      const angles: IAutoMovieSolveAirborneTakeoff.IAngles =
        AirborneTakeoffAngles(into, flight.orientation(seconds));
      somersault =
        angles.somersault +
        2 *
          Math.PI *
          Math.round((somersault - angles.somersault) / (2 * Math.PI));
      twist =
        angles.twist +
        2 * Math.PI * Math.round((twist - angles.twist) / (2 * Math.PI));
      tilt = angles.tilt;
    }
    return { somersault, tilt, twist };
  }
}
