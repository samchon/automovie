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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed endpoint/tangent frames, metre/second units, duration and dimensionless query time.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the original AutoMovieStationHermite combine and weight equations, with physical velocities scaled by the same segment duration; fixed endpoint/tangent arrays are independent of query time.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One endpoint conversion precedes the existing Hermite owner's actual per-time weight and combination.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No polynomial regrouping, duration clamp, endpoint or velocity change; the same coordinate combination produces every point.
 * @evidence contracts/development/implementation.md#efficient-algorithms Endpoint and tangent arrays are built once per segment instead of each frame; each query retains the original constant three-coordinate Hermite work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The throwing plan owns one builder for its acceleration and one for its follow-through, each with fixed endpoints, tangents and duration; varying normalized times compute their own points.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each builder retains two three-coordinate endpoint/tangent records and one duration until the plan is released, with no time samples, fitted results or external handles.
 */
export function throwObjectCurve(
  a: IAutoMovieVector3,
  va: IAutoMovieVector3,
  b: IAutoMovieVector3,
  vb: IAutoMovieVector3,
  span: number,
): (time: number) => IAutoMovieVector3 {
  const first: Parameters<typeof AutoMovieStationHermite.combine>[0] = {
    value: [a.x, a.y, a.z], slope: [va.x, va.y, va.z],
  };
  const last: Parameters<typeof AutoMovieStationHermite.combine>[1] = {
    value: [b.x, b.y, b.z], slope: [vb.x, vb.y, vb.z],
  };
  return (time: number): IAutoMovieVector3 => {
    const [x, y, z]: ReturnType<typeof AutoMovieStationHermite.combine> = AutoMovieStationHermite.combine(first, last,
      AutoMovieStationHermite.weights(time, span, 0, false));
    return { x: x!, y: y!, z: z! };
  };
}
