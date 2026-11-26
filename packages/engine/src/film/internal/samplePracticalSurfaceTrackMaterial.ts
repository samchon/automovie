import type { IAutoMoviePracticalSurfaceTrack } from "@automovie/interface";

/**
 * Read the material at an in-shot time from one admitted practical surface
 * track. The most recent key at or before the requested seconds takes effect.
 */
export function samplePracticalSurfaceTrackMaterial(
  track: IAutoMoviePracticalSurfaceTrack,
  seconds: number,
): string {
  let lower: number = 0;
  let upper: number = track.keys.length;
  while (lower < upper) {
    const middle: number = lower + Math.floor((upper - lower) / 2);
    if (track.keys[middle]!.time <= seconds) lower = middle + 1;
    else upper = middle;
  }
  return track.keys[lower - 1]!.material;
}
