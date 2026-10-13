/**
 * What the watcher observed on one probe of its port.
 *
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
