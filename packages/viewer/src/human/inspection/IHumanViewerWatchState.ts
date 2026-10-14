/**
 * What the watcher observed on one probe of its port.
 *
 * @evidence contracts/common.md#principled-implementation A watcher probe separates recognized health answers, connection refusal and its own child liveness before deciding whether to start or keep watching.
 * @evidence contracts/common.md#clear-and-simple-design Three facts expose listener health and child ownership without coupling watcher policy to HTTP parsing details.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A busy unanswered listener is not declared absent merely because no health answer arrived.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish this viewer's health answer, a refused port and the watcher's own running child.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The watch-state value implements no port probe or process-ownership comparison algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This snapshot gives no persistent authority over listener state or a reusable start decision.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Child liveness is a boolean observation; the watcher separately owns and retires its child process handle.
 *
 * @author Samchon
 */
export interface IHumanViewerWatchState {
  /** `/health` answered as this viewer. */
  answered: boolean;

  /** This attempted connection was refused; it is not an independent inventory of port listeners. */
  refused: boolean;

  /** The watcher's own server child is still running. */
  ownedRunning: boolean;

}
