import type { IAutoMovieSpeedProfile } from "@automovie/interface";

/**
 * The speeds a stretch of a length can end at from an entry speed under the
 * rates: from braking all the way to accelerating all the way.
 *
 * @param speed The entry speed, metres per second.
 * @param length The stretch's length, metres.
 * @param acceleration The acceleration, metres per second squared.
 * @param deceleration The braking, metres per second squared.
 * @returns The least and greatest end speed, metres per second; the least is
 *   0 when the stretch is long enough to stop in.
 */
export function speedProfileReach(
  speed: number,
  length: number,
  acceleration: number,
  deceleration: number,
): IAutoMovieSpeedProfile.IReachResult {
  return {
    minimum: Math.sqrt(Math.max(0, speed * speed - 2 * deceleration * length)),
    maximum: Math.sqrt(speed * speed + 2 * acceleration * length),
  };
}
