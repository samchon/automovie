import type { AutoMovieViewerInspector } from "../AutoMovieViewerInspector.js";
import type { IAutoMovieViewerInspectorAction } from "../IAutoMovieViewerInspectorAction.js";
import { locateAutoMovieInspectorFinding } from "./locateAutoMovieInspectorFinding.js";

/*
 * Stop the inspector at one finding's witness: move the playhead there, stop
 * it, and locate the request there.
 *
 * Stopping playback makes the time readout write the stopped second into the
 * request, so the playhead is moved to the witness before it stops: the stopped
 * second and the located second are then the same, whichever edit the reducer
 * receives last.
 * Parameter props: Witness, drawn paths, playhead and request dispatch.
 */
export function showAutoMovieInspectorFinding(
  props: AutoMovieViewerInspector.IShowFindingRequest,
): void {
  const { observation, paths, playhead, dispatch }: AutoMovieViewerInspector.IShowFindingRequest = props;
  const action: IAutoMovieViewerInspectorAction.ILocate =
    locateAutoMovieInspectorFinding({ observation, paths });
  playhead.seek(action.seconds);
  playhead.pause();
  dispatch({
    ...action,
    seconds: playhead.getSnapshot().seconds,
  });
}