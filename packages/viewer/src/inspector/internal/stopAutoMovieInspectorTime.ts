import type { AutoMovieViewerInspectorPlayhead } from "../AutoMovieViewerInspectorPlayhead.js";
import type { IAutoMovieViewerInspectorAction } from "../IAutoMovieViewerInspectorAction.js";

/*
 * Return the time edit implied by a transition from playing to stopped.
 */
export function stopAutoMovieInspectorTime(
  playing: boolean,
  snapshot: AutoMovieViewerInspectorPlayhead.ISnapshot,
): IAutoMovieViewerInspectorAction.ITime | null {
  return playing && !snapshot.playing
    ? { type: "time", seconds: snapshot.seconds }
    : null;
}
