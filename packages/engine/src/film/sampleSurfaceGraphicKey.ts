import type { IAutoMovieSurfaceGraphicTrack } from "@automovie/interface";

/**
 * Index of the key in force at shot-local `seconds` on one admitted surface
 * graphic track: the last key whose time is at or before `seconds`, so a key
 * takes effect at its exact time and holds until the next key.
 *
 * The result depends on `seconds` alone, so a seek, a reverse seek and a
 * sequential run read the same key. Admission opens every track at zero, so a
 * key exists at every in-shot time; a time before zero or a non-finite one
 * throws a `RangeError`.
 */
export function sampleSurfaceGraphicKey(
  track: IAutoMovieSurfaceGraphicTrack,
  seconds: number,
): number {
  if (seconds < 0)
    throw new RangeError(
      `Surface graphic "${track.node}/${track.surface}" cannot be sampled at ${seconds} s`,
    );

  // Upper-bound search for the first key strictly after the sample.
  let lower: number = 0;
  let upper: number = track.keys.length;
  while (lower < upper) {
    const middle: number = lower + Math.floor((upper - lower) / 2);
    if (track.keys[middle]!.time <= seconds) lower = middle + 1;
    else upper = middle;
  }
  return lower - 1;
}
