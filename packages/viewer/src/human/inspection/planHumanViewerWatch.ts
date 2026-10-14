import type { IHumanViewerWatchState } from "./IHumanViewerWatchState.js";

/**
 * Decide what the watcher does on one probe of the resident viewer. A server that answers is left alone. A server starts only when the connection is refused and the watcher has no running child, the same rule `ensure` follows. Silence never establishes process death and cannot authorize restarting either an owned child or another session's server.
 *
 * @evidence contracts/common.md#principled-implementation Health answers preserve the listener; only actual refusal without an owned running child authorizes starting.
 * @evidence contracts/common.md#clear-and-simple-design Two branches separate answered, safe-start and every other wait state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Silence cannot establish process death or authorize restarting a foreign session listener.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the same safe-start rule as ensure and distinguishes unanswered from absent.
 * @evidence contracts/performance.md#efficient-algorithms Three supplied state facts require constant decision work and no process/network traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Every decision uses this probe's facts rather than a previous refusal as current authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources A literal result retains no timer, child process or health body.
 */
export function planHumanViewerWatch(
  state: IHumanViewerWatchState,
): "wait" | "start" {
  if (state.answered) return "wait";
  if (state.refused && !state.ownedRunning) return "start";
  return "wait";
}
