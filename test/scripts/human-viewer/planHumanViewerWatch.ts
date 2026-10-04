import type { IHumanViewerWatchState } from "./IHumanViewerWatchState";

/**
 * Decide what the watcher does on one probe of the resident viewer. A server
 * that answers is left alone. A server starts only when the connection is
 * refused and the watcher has no running child, the same rule `ensure`
 * follows. Only the watcher's own child may be restarted, after `limitMs` of
 * silence; a silent server the watcher did not start, another session's or
 * one started by `ensure`, is waited for and never killed, because a session
 * never restarts or stops a server it did not start.
 *
 * @evidence contracts/common.md#principled-implementation Ownership of the child process, not the record file or the speed of one answer, decides whether anything is killed.
 * @evidence contracts/common.md#clear-and-simple-design One pure decision owns the watcher's three outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No process is chosen by name or by record; only the watcher's own child is restarted.
 * @evidence contracts/common.md#meaningful-documentation States the start rule, the ownership rule and the hang limit.
 */
export function planHumanViewerWatch(state: IHumanViewerWatchState): "wait" | "start" | "restart" {
  if (state.answered) return "wait";
  if (state.refused && !state.ownedRunning) return "start";
  return state.ownedRunning && state.silentMs > state.limitMs ? "restart" : "wait";
}
