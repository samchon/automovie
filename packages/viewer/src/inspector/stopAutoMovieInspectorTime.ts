import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";

/**
 * The request edit a playhead change implies: when playback stops, by a pause
 * or at the end, the stopped second becomes the request's.
 *
 * @param playing Whether the playhead played at the previous snapshot.
 * @param snapshot The current snapshot.
 * @returns The `time` edit for a stop, or null when playback did not stop.
 */
export function stopAutoMovieInspectorTime(
  playing: boolean,
  snapshot: AutoMovieInspectorPlayhead.ISnapshot,
): IAutoMovieInspectorAction.ITime | null {
  return playing && !snapshot.playing
    ? { type: "time", seconds: snapshot.seconds }
    : null;
}
