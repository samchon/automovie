import type { IAutoMovieInspectionDiagnostics } from "@automovie/interface";

import type { AutoMovieInspectorPlayhead } from "./AutoMovieInspectorPlayhead.js";
import type { IAutoMovieInspectorAction } from "./IAutoMovieInspectorAction.js";
import { locateAutoMovieInspectorFinding } from "./locateAutoMovieInspectorFinding.js";

/**
 * Stop the inspector at one finding's witness: move the playhead there, stop
 * it, and locate the request there.
 *
 * Stopping playback makes the time readout write the stopped second into the
 * request, so the playhead is moved to the witness before it stops: the stopped
 * second and the located second are then the same, whichever edit the reducer
 * receives last.
 *
 * @param props The witness, the drawn paths, the playhead and the request's
 *   dispatch.
 */
export function showAutoMovieInspectorFinding(props: {
  /** The witness to show. */
  observation: IAutoMovieInspectionDiagnostics.IObservation;

  /** The identity paths the scene draws. */
  paths: readonly string[];

  /** The inspector's playhead. */
  playhead: AutoMovieInspectorPlayhead;

  /** Where the request edit goes. */
  dispatch: (action: IAutoMovieInspectorAction) => void;
}): void {
  const action: IAutoMovieInspectorAction.ILocate =
    locateAutoMovieInspectorFinding(props.observation, props.paths);
  props.playhead.seek(action.seconds);
  props.playhead.pause();
  props.dispatch({
    ...action,
    seconds: props.playhead.getSnapshot().seconds,
  });
}
