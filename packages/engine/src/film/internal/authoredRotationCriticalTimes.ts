import {
  IAutoMovieClip,
  IAutoMovieQuaternion,
  IAutoMovieTrack,
} from "@automovie/interface";

import { adjacentFloat64 } from "../../math/internal/adjacentFloat64";
import { quaternionInterpolationCriticalRatios } from "../../math/internal/quaternionInterpolationCriticalRatios";

/*
 * Add analytical rotation extrema and one-sided key samples to shot admission.
 *
 * Clips must have passed transform-track admission. Each loop repeats the same
 * component curve against the same direct limits, so one cycle suffices;
 * sequence authority can only replace an earlier track, never restore it. The
 * owner resolves the complete sequence, so a hidden track gains no authority.
 * Nearest representable neighbours check the values just inside key boundaries,
 * including shortest-arc quaternion sign changes and cross-clip handoffs.
 */
export function authoredRotationCriticalTimes(
  clips: readonly IAutoMovieClip[],
  shotDuration: number,
): Set<number> {
  const times: Set<number> = new Set();
  function keep(time: number): void {
    if (time >= 0 && time <= shotDuration) times.add(time);
  }
  for (const clip of clips) {
    const phases: Set<number> = new Set();
    for (const track of clip.tracks) {
      for (const time of track.times) phases.add(time);
      if (
        track.interpolation !== "linear" ||
        track.channel.kind !== "node" ||
        track.channel.path !== "rotation"
      )
        continue;
      for (let index: number = 0; index + 1 < track.times.length; index++) {
        const start: number = track.times[index]!;
        const end: number = track.times[index + 1]!;
        for (const ratio of quaternionInterpolationCriticalRatios(
          keyQuaternion(track, index),
          keyQuaternion(track, index + 1),
        ))
          phases.add(start * (1 - ratio) + end * ratio);
      }
    }
    for (const time of phases) {
      if (time < 0 || time > shotDuration) continue;
      keep(time);
      if (time > 0) keep(adjacentFloat64(time, false));
      if (time < shotDuration) keep(adjacentFloat64(time, true));
    }
  }
  return times;
}

/*
 * Read an admitted linear rotation key in glTF x/y/z/w order.
 */
function keyQuaternion(
  track: IAutoMovieTrack,
  index: number,
): IAutoMovieQuaternion {
  const offset: number = index * 4;
  return {
    x: track.values[offset]!,
    y: track.values[offset + 1]!,
    z: track.values[offset + 2]!,
    w: track.values[offset + 3]!,
  };
}
