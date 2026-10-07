/**
 * What the watcher observed on one probe of its port.
 *
 * @evidence contracts/common.md#principled-implementation Separates a refused port, an unanswered one and the watcher's own child, so ownership decides every kill.
 * @evidence contracts/common.md#meaningful-documentation Names each observation.
 * @author Samchon
 */
export interface IHumanViewerWatchState {
  /** `/health` answered as this viewer. */
  answered: boolean;

  /** The connection was refused: nothing listens on the port. */
  refused: boolean;

  /** The watcher's own server child is still running. */
  ownedRunning: boolean;

  /** Milliseconds the port has gone without an answer. */
  silentMs: number;

  /** Silence after which the watcher's own server counts as hung. */
  limitMs: number;
}
