import { AutoMovieStationHermite } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Prepare a throw's Hermite segment with its fixed endpoints and velocities.
 *
 * @param a The first world point, metres.
 * @param va Its world velocity, metres per second.
 * @param b The last world point, metres.
 * @param vb Its world velocity, metres per second.
 * @param span The segment's duration in seconds.
 * @returns The actual world point at each normalized segment time.
 */
export function throwObjectCurve(
  a: IAutoMovieVector3,
  va: IAutoMovieVector3,
  b: IAutoMovieVector3,
  vb: IAutoMovieVector3,
  span: number,
): (time: number) => IAutoMovieVector3 {
  const first: Parameters<typeof AutoMovieStationHermite.combine>[0] = {
    value: [a.x, a.y, a.z],
    slope: [va.x, va.y, va.z],
  };
  const last: Parameters<typeof AutoMovieStationHermite.combine>[1] = {
    value: [b.x, b.y, b.z],
    slope: [vb.x, vb.y, vb.z],
  };
  return (time: number): IAutoMovieVector3 => {
    const [x, y, z]: ReturnType<typeof AutoMovieStationHermite.combine> =
      AutoMovieStationHermite.combine(
        first,
        last,
        AutoMovieStationHermite.weights(time, span, 0, false),
      );
    return { x: x!, y: y!, z: z! };
  };
}
