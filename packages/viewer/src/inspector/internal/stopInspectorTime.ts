import type { AutoMovieViewerInspectorPlayhead } from "../AutoMovieViewerInspectorPlayhead";
import type { IAutoMovieViewerInspectorAction } from "../IAutoMovieViewerInspectorAction";

/*
 * Return the time edit implied by a transition from playing to stopped.
 */
export function stopInspectorTime(
  playing: boolean,
  snapshot: AutoMovieViewerInspectorPlayhead.ISnapshot,
): IAutoMovieViewerInspectorAction.ITime | null {
  return playing && !snapshot.playing
    ? { type: "time", seconds: snapshot.seconds }
    : null;
}
