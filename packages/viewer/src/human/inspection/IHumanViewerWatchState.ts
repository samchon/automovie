/**
 * What the watcher observed on one probe of its port.
 *
 * @evidence contracts/common.md#principled-implementation Port answers, refused connections and the watcher's own running child remain independent observations.
 * @evidence contracts/common.md#clear-and-simple-design Three booleans carry the inputs to the watcher's ownership decision without embedding process control.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unanswered probe cannot manufacture ownership or authorize stopping another session's process.
 * @evidence contracts/common.md#meaningful-documentation Defines a valid viewer health answer, connection refusal and the watcher's actual child liveness.
 * @author Samchon
 */
export interface IHumanViewerWatchState {
  /** `/health` answered as this viewer. */
  answered: boolean;

  /** The connection was refused: nothing listens on the port. */
  refused: boolean;

  /** The watcher's own server child is still running. */
  ownedRunning: boolean;

}
