import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/**
 * The request edit a playhead change implies: when playback stops, by a pause or at the end, the stopped second becomes the request's.
 *
 * @param playing Whether the playhead played at the previous snapshot.
 * @param snapshot The current snapshot.
 * @returns The `time` edit for a stop, or null when playback did not stop.
 * @evidence contracts/development/common.md#meaningful-documentation States when an edit is implied and which second it names.
 * @evidence contracts/development/implementation.md#principled-implementation The request names the picture left on screen, which is the playhead's second when it stops.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Playing frames and changes that stop nothing imply no edit.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Holds nothing.
 */
export function stopAutoMovieInspectorTime(
  playing: boolean,
  snapshot: AutoMovieInspectorPlayhead.ISnapshot,
): IAutoMovieInspectorAction.ITime | null {
  return playing && !snapshot.playing
    ? { type: "time", seconds: snapshot.seconds }
    : null;
}
