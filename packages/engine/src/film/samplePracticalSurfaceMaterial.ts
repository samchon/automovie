import type {
  IAutoMoviePracticalSurfaceTrack,
  IAutoMovieShot,
} from "@automovie/interface";

import { samplePracticalSurfaceTrackMaterial } from "./samplePracticalSurfaceTrackMaterial";

/**
 * Sample the material id for one prop part from an admitted shot. Time is
 * shot-local seconds in [0, duration). A key takes effect at its exact time.
 * Returns undefined for an untracked part or a time outside that interval.
 *
 * @param shot An admitted shot with optional practical surface tracks.
 * @param node The placed prop's scene node id.
 * @param part Its model part id.
 * @param time The shot-local sample time in seconds.
 * @returns The material id in the target model, or undefined.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the target scope, time interval, exact key behavior, input premise and absence result.
 * @evidence contracts/development/implementation.md#principled-implementation Selects the node-part pair and finds the greatest admitted key time at or before the sample by upper-bound search.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The function only selects a target and searches its ordered keys. Admitting inputs and applying appearance are separate operations.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads only fixed material ids and the requested time. Seeks do not depend on earlier samples or mutate a prop or its model.
 * @evidence contracts/development/implementation.md#efficient-algorithms One linear search across the tracks and one logarithmic search within the selected track, using constant auxiliary space.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The admitted keys are searched in place, with no derived work to retain across frame requests.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows shot data for one call and returns only a scalar or undefined.
 */
export function samplePracticalSurfaceMaterial(
  shot: IAutoMovieShot,
  node: string,
  part: string,
  time: number,
): string | undefined {
  if (!Number.isFinite(time) || time < 0 || time >= shot.duration)
    return undefined;
  const track: IAutoMoviePracticalSurfaceTrack | undefined =
    shot.practicalSurfaces?.find(
      (entry: IAutoMoviePracticalSurfaceTrack): boolean =>
        entry.node === node && entry.part === part,
    );
  if (track === undefined) return undefined;

  return samplePracticalSurfaceTrackMaterial(track, time);
}
