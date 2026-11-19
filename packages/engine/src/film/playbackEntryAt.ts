import type { IAutoMoviePlaybackEntry } from "@automovie/interface";

/**
 * Locate the last prepared playback entry starting at or before the output second, or strictly before with `includeStart` false.
 *
 * A nonempty admitted layout has nondecreasing starts. Equal starts select the latest entry, as the forward playback cursor does. Before the first start, returns the first entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the sorted nonempty premise, output clock and boundary behavior.
 * @evidence contracts/development/implementation.md#principled-implementation Binary search maintains a candidate index and checks the upper midpoint by start time, so equal start times converge to the last index.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares random-access occurrence selection between the playback sampler and take anchor resolver.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Search uses exact comparisons of prepared starts, including ties.
 * @evidence contracts/development/implementation.md#efficient-algorithms Search takes O(log E) time and constant extra space for E entries.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Consumes an existing layout and performs one search for the requested instant.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a borrowed entry and holds no other references after return.
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
