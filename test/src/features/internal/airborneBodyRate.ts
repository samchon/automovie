import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { rotationLogarithm } from "./rotationLogarithm";

/**
 * The centered body rate of an orientation curve at a time, in rad/s, read
 * from the rotation vectors to the orientations one `offset` seconds either
 * side.
 *
 * @param flight The flight whose orientation is differenced.
 * @param seconds The time of the rate.
 * @param offset Half the difference interval, in seconds.
 * @returns The body angular velocity.
 */
export const airborneBodyRate: (
  flight: IAutoMovieIntegrateAirborneRotation.IFlight,
  seconds: number,
  offset: number,
) => IAutoMovieVector3 = (
  flight: IAutoMovieIntegrateAirborneRotation.IFlight,
  seconds: number,
  offset: number,
): IAutoMovieVector3 => {
  const origin: IAutoMovieQuaternion = flight.orientation(seconds);
  const low: IAutoMovieVector3 = rotationLogarithm(
    origin,
    flight.orientation(seconds - offset),
  );
  const high: IAutoMovieVector3 = rotationLogarithm(
    origin,
    flight.orientation(seconds + offset),
  );
  return {
    x: (high.x - low.x) / (2 * offset),
    y: (high.y - low.y) / (2 * offset),
    z: (high.z - low.z) / (2 * offset),
  };
};
