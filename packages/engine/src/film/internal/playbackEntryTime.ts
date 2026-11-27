import type { IAutoMoviePlaybackEntry } from "@automovie/interface";

/*
 * The shot-local second an entry shows at an output second: its offset plus its
 * playback rate, 1 when omitted, times the output seconds since its start.
 *
 * The map is affine and defined at any output second, so a caller may read an
 * entry's clock at sub-frame instants inside its span. It does not check that
 * the instant lies in the entry's span.
 * Parameter entry: An entry of a playback timeline.
 * Parameter seconds: Output-clock seconds.
 * Returns: Shot-local seconds.
 */
export function playbackEntryTime(
  entry: IAutoMoviePlaybackEntry,
  seconds: number,
): number {
  return entry.offset + (seconds - entry.start) * (entry.playbackRate ?? 1);
}
