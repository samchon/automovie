/**
 * What the watcher observed on one probe of its port.
 *
 * @evidence contracts/common.md#principled-implementation Port answers, refused connections and the watcher's own running child remain independent observations.
 * @evidence contracts/common.md#clear-and-simple-design Three booleans carry the inputs to the watcher's ownership decision without embedding process control.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unanswered probe cannot manufacture ownership or authorize stopping another session's process.
 * @evidence contracts/common.md#meaningful-documentation Defines a valid viewer health answer, connection refusal and the watcher's actual child liveness.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Port answers, refused connections and the watcher's own running child remain independent observations.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Three booleans carry the inputs to the watcher's ownership decision without embedding process control.
 * @author Samchon
 */
export interface IHumanViewerWatchState {
  /**
   * `/health` answered as this viewer.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation `/health` answered as this viewer. Port answers, refused connections and the watcher's own running child remain independent observations.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform `/health` answered as this viewer. Three booleans carry the inputs to the watcher's ownership decision without embedding process control.
   */
  answered: boolean;

  /**
   * The connection was refused: nothing listens on the port.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The connection was refused: nothing listens on the port. Port answers, refused connections and the watcher's own running child remain independent observations.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The connection was refused: nothing listens on the port. Three booleans carry the inputs to the watcher's ownership decision without embedding process control.
   */
  refused: boolean;

  /**
   * The watcher's own server child is still running.
   *
   * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The watcher's own server child is still running. Port answers, refused connections and the watcher's own running child remain independent observations.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform The watcher's own server child is still running. Three booleans carry the inputs to the watcher's ownership decision without embedding process control.
   */
  ownedRunning: boolean;

}
