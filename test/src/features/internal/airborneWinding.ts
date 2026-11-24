import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The winding of the observed long axis of a flight about the take-off X axis,
 * in radians: the long axis (the body Y axis) projected on the YZ plane of the
 * take-off frame, its angle unwrapped over 121 reads of the flight.
 *
 * @param flight The flight whose orientation is read over [0, 1].
 * @param q0 The take-off orientation that defines the frame.
 * @returns The signed total turn of the long axis.
 */
export const airborneWinding: (
  flight: IAutoMovieIntegrateAirborneRotation.IFlight,
  q0: IAutoMovieQuaternion,
) => number = (
  flight: IAutoMovieIntegrateAirborneRotation.IFlight,
  q0: IAutoMovieQuaternion,
): number => {
  let winding: number = 0;
  let previous: number = 0;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(q0);
  // Two reads per 60 Hz display frame keep adjacent samples well within a half turn.
  const samples: number = 120;
  for (let k: number = 0; k <= samples; ++k) {
    const relative: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      flight.orientation(k / samples),
    );
    const long: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
      x: 0,
      y: 1,
      z: 0,
    });
    const angle: number = Math.atan2(long.z, long.y);
    const change: number = angle - previous;
    winding += change - 2 * Math.PI * Math.round(change / (2 * Math.PI));
    previous = angle;
  }
  return winding;
};
