import type { IAutoMoviePlaybackEntry } from "@automovie/interface";

/**
 * Locate the last prepared playback entry starting at or before the output
 * second, or strictly before with `includeStart` false.
 *
 * A nonempty admitted layout has nondecreasing starts. Equal starts select the
 * latest entry, as the forward playback cursor does. Before the first start,
 * returns the first entry.
 */
export function playbackEntryAt(
  entries: readonly IAutoMoviePlaybackEntry[],
  seconds: number,
  includeStart: boolean = true,
): IAutoMoviePlaybackEntry {
  let low: number = 0;
  let high: number = entries.length - 1;
  while (low < high) {
    const middle: number = Math.ceil((low + high) / 2);
    const start: number = entries[middle]!.start;
    if (start < seconds || (includeStart && start === seconds)) low = middle;
    else high = middle - 1;
  }
  return entries[low]!;
}
