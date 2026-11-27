import type { AutoMovieInspectorPlayhead } from "../AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorAction } from "../IAutoMovieInspectorAction.js";

/*
 * Return the time edit implied by a transition from playing to stopped.
 */
export function stopAutoMovieInspectorTime(
  playing: boolean,
  snapshot: AutoMovieInspectorPlayhead.ISnapshot,
): IAutoMovieInspectorAction.ITime | null {
  return playing && !snapshot.playing
    ? { type: "time", seconds: snapshot.seconds }
    : null;
}
