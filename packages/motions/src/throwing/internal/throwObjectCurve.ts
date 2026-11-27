import { AutoMovieEngineStationHermite } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * Prepare a throw's Hermite segment with its fixed endpoints and velocities.
 * Parameter a: The first world point, metres.
 * Parameter va: Its world velocity, metres per second.
 * Parameter b: The last world point, metres.
 * Parameter vb: Its world velocity, metres per second.
 * Parameter span: The segment's duration in seconds.
 * Returns: The actual world point at each normalized segment time.
 */
export function throwObjectCurve(
  a: IAutoMovieVector3,
  va: IAutoMovieVector3,
  b: IAutoMovieVector3,
  vb: IAutoMovieVector3,
  span: number,
): (time: number) => IAutoMovieVector3 {
  const first: Parameters<typeof AutoMovieEngineStationHermite.combine>[0] = {
    value: [a.x, a.y, a.z],
    slope: [va.x, va.y, va.z],
  };
  const last: Parameters<typeof AutoMovieEngineStationHermite.combine>[1] = {
    value: [b.x, b.y, b.z],
    slope: [vb.x, vb.y, vb.z],
  };
  return (time: number): IAutoMovieVector3 => {
    const [x, y, z]: ReturnType<typeof AutoMovieEngineStationHermite.combine> =
      AutoMovieEngineStationHermite.combine(
        first,
        last,
        AutoMovieEngineStationHermite.weights(time, span, 0, false),
      );
    return { x: x!, y: y!, z: z! };
  };
}
