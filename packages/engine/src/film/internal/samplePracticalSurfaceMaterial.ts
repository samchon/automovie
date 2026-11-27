import type {
  IAutoMoviePracticalSurfaceTrack,
  IAutoMovieShot,
} from "@automovie/interface";

import { samplePracticalSurfaceTrackMaterial } from "./samplePracticalSurfaceTrackMaterial";

/*
 * Sample the material id for one prop part from an admitted shot. Time is
 * shot-local seconds in [0, duration). A key takes effect at its exact time.
 * Returns undefined for an untracked part or a time outside that interval.
 * Parameter shot: An admitted shot with optional practical surface tracks.
 * Parameter node: The placed prop's scene node id.
 * Parameter part: Its model part id.
 * Parameter time: The shot-local sample time in seconds.
 * Returns: The material id in the target model, or undefined.
 */
export function samplePracticalSurfaceMaterial(
  shot: PracticalSurfaceShot,
  node: string,
  part: string,
  time: number,
): string | undefined {
  if (time < 0 || time >= shot.duration) return undefined;
  const track: IAutoMoviePracticalSurfaceTrack | undefined =
    shot.practicalSurfaces?.find(
      (entry: IAutoMoviePracticalSurfaceTrack): boolean =>
        entry.node === node && entry.part === part,
    );
  if (track === undefined) return undefined;

  return samplePracticalSurfaceTrackMaterial(track, time);
}

/*
 * The shot clock and admitted tracks used by practical surface reads.
 */
type PracticalSurfaceShot = Pick<
  IAutoMovieShot,
  "duration" | "practicalSurfaces"
>;
