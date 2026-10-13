import type { IHumanViewerWatchState } from "./IHumanViewerWatchState.js";

/**
 * Decide what the watcher does on one probe of the resident viewer. A server
 * that answers is left alone. A server starts only when the connection is
 * refused and the watcher has no running child, the same rule `ensure`
 * follows. Silence never establishes process death and cannot authorize
 * restarting either an owned child or another session's server.
 */
export function planHumanViewerWatch(
  state: IHumanViewerWatchState,
): "wait" | "start" {
  if (state.answered) return "wait";
  if (state.refused && !state.ownedRunning) return "start";
  return "wait";
}
