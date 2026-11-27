import type {
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Expose a completed numeric trajectory as an airborne flight, outside the
 * integration right-hand side's scope.
 */
export function AirborneRotationFlight(
  trajectory: IAutoMovieIntegrateMotionTrajectory.ITrajectory,
  count: number,
): IAutoMovieIntegrateAirborneRotation.IFlight {
  return {
    t0: trajectory.t0,
    t1: trajectory.t1,
    h: trajectory.h,
    knots: trajectory.knots,
    orientation: (seconds: number): IAutoMovieQuaternion =>
      trajectory.orientation === undefined
        ? trajectory.at(seconds).q!
        : trajectory.orientation(seconds)!,
    variations: (seconds: number): IAutoMovieVector3[] => {
      const x: number[] = trajectory.at(seconds).x;
      return Array.from(
        { length: count },
        (_: unknown, i: number): IAutoMovieVector3 => ({
          x: x[3 * i]!,
          y: x[3 * i + 1]!,
          z: x[3 * i + 2]!,
        }),
      );
    },
  };
}
