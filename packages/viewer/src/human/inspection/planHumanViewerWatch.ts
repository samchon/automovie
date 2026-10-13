import type { IHumanViewerWatchState } from "./IHumanViewerWatchState.js";

/**
 * Decide what the watcher does on one probe of the resident viewer. A server
 * that answers is left alone. A server starts only when the connection is
 * refused and the watcher has no running child, the same rule `ensure`
 * follows. Silence never establishes process death and cannot authorize
 * restarting either an owned child or another session's server.
 *
 * @evidence contracts/common.md#principled-implementation Ownership of the child process, not the record file or the speed of one answer, decides whether anything is killed.
 * @evidence contracts/common.md#clear-and-simple-design One pure decision distinguishes waiting from starting after a refused connection and an absent owned child.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No process is killed because a health response was slow.
 * @evidence contracts/common.md#meaningful-documentation States the start rule and the absence of silence-based recovery.
 */
export function planHumanViewerWatch(
  state: IHumanViewerWatchState,
): "wait" | "start" {
  if (state.answered) return "wait";
  if (state.refused && !state.ownedRunning) return "start";
  return "wait";
}
