import { IAutoMovieClip, IAutoMovieQuaternion, IAutoMovieTrack } from "@automovie/interface";

import { adjacentAutoMovieFloat64 } from "../math/adjacentAutoMovieFloat64";
import { quaternionInterpolationCriticalRatios } from "../math/quaternionInterpolationCriticalRatios";

/**
 * Add analytical rotation extrema and one-sided key samples to shot admission.
 *
 * Clips must have passed transform-track admission. Each loop repeats the same component curve against the same direct limits, so one cycle suffices; sequence authority can only replace an earlier track, never restore it. The owner resolves the complete sequence, so a hidden track gains no authority. Nearest representable neighbours check the values just inside key boundaries, including shortest-arc quaternion sign changes and cross-clip handoffs.
 *
 * @evidence contracts/common.md#principled-implementation Every linear quaternion segment contributes derivative roots from quaternionInterpolationCriticalRatios, using the sampler's spherical or normalized-linear law. Affine conversion puts roots on its first-cycle clock; loops repeat the same component curve and direct limits, while latest-start sequence authority never restores a superseded track. Adjacent binary64 key neighbours observe one-sided values, including sign-adjusted arc endpoints, through the actual resolver with ordinary floating clock rounding.
 * @evidence contracts/common.md#clear-and-simple-design Collects clocks only; gateAuthoredObjectMotions resolves shared clip authority, drivers and profile limits at those clocks. Mathematical derivative ownership remains in the quaternion helper, while step/linear boundaries share the existing floating neighbour operation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixed-rate grid, profile-specific angle or fixture timing is chosen; each sample follows a real key boundary or interpolation stationary point, and the full sequence later determines which authored track is visible.
 * @evidence contracts/common.md#meaningful-documentation States admitted-track premises, loop-clock mapping, one-sided boundary purpose, actual sequence authority and floating-clock limitations; results contain only finite shot-local seconds in the closed shot span.
 * @evidence contracts/performance.md#efficient-algorithms Visits K keys and at most four derivative roots per quaternion segment in O(K) time and storage, deduplicating clocks in a set. One cycle bounds each directly interpolated periodic curve, so tiny loop durations do not create a duration-dependent sampling population.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the first-cycle component extrema for identical later loop phases under constant direct limits; later latest-start authority can hide that track but cannot reactivate it. Nonlinear driver combinations require their own extrema analysis and are outside this helper's direct-curve premise.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Local ratios and phase clocks are released after each clip; the returned set grows only with authored keys and segment roots, owned until the gate completes, with no handles or tasks retained.
 */
export function authoredRotationCriticalTimes(clips: readonly IAutoMovieClip[], shotDuration: number): Set<number> {
  const times: Set<number> = new Set();
  function keep(time: number): void {
    if (Number.isFinite(time) && time >= 0 && time <= shotDuration) times.add(time);
  }
  for (const clip of clips) {
    const phases: Set<number> = new Set();
    for (const track of clip.tracks) {
      for (const time of track.times) phases.add(time);
      if (track.interpolation !== "linear" || track.channel.kind !== "node" || track.channel.path !== "rotation") continue;
      for (let index: number = 0; index + 1 < track.times.length; index++) {
        const start: number = track.times[index]!;
        const end: number = track.times[index + 1]!;
        for (const ratio of quaternionInterpolationCriticalRatios(keyQuaternion(track, index), keyQuaternion(track, index + 1)))
          phases.add(start * (1 - ratio) + end * ratio);
      }
    }
    for (const time of phases) {
      if (!Number.isFinite(time) || time < 0 || time > shotDuration) continue;
      keep(time);
      if (time > 0) keep(adjacentAutoMovieFloat64(time, false));
      if (time < shotDuration) keep(adjacentAutoMovieFloat64(time, true));
    }
  }
  return times;
}

/** Read an admitted linear rotation key in glTF x/y/z/w order. */
function keyQuaternion(track: IAutoMovieTrack, index: number): IAutoMovieQuaternion {
  const offset: number = index * 4;
  return { x: track.values[offset]!, y: track.values[offset + 1]!, z: track.values[offset + 2]!, w: track.values[offset + 3]! };
}
