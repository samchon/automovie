/**
 * Decide what the watcher does on one probe of the resident viewer. A server
 * that answers is left alone. A silent one is only dead when its recorded
 * process is gone and the watcher owns no running child. A silent server whose
 * process is still alive is busy (a long rebuild or a heavy capture holds its
 * single event loop), so the watcher waits, and only after `limitMs` of
 * silence calls it hung and restarts it. A restart kills the recorded and owned
 * processes and must wait for the port to be released before starting another
 * server, so two servers never contend for the same port.
 *
 * @evidence contracts/common.md#principled-implementation Liveness of the recorded process, not the speed of one HTTP answer, separates a busy server from a dead one.
 * @evidence contracts/common.md#clear-and-simple-design One pure decision owns the watcher's three outcomes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No process is chosen by name; only the recorded pid and the watcher's own child are considered.
 * @evidence contracts/common.md#meaningful-documentation States busy versus dead, the hang limit and the port-release requirement.
 */
export function planHumanViewerWatch(state: {
  answered: boolean;
  recordedAlive: boolean;
  ownedRunning: boolean;
  silentMs: number;
  limitMs: number;
}): "wait" | "start" | "restart" {
  if (state.answered) return "wait";
  if (!state.recordedAlive && !state.ownedRunning) return "start";
  return state.silentMs > state.limitMs ? "restart" : "wait";
}
