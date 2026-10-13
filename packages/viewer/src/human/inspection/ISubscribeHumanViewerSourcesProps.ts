import type { IHumanViewerWatchedSource } from "./IHumanViewerWatchedSource.js";

/**
 * What source watching needs from the host.
 *
 * @evidence contracts/common.md#principled-implementation Source watching refreshes authority and reports moved revisions through separate host callbacks.
 * @evidence contracts/common.md#clear-and-simple-design The host retains watcher, catalogue and notification effects while the subscription owns edit batching.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reached-source notification and optional scheduling describe actual edits rather than timer-based viewer cancellation.
 * @evidence contracts/common.md#meaningful-documentation Defines watcher registration, input rescan, publication, updating state and cancellable batch scheduling.
 * @author Samchon
 */
export interface ISubscribeHumanViewerSourcesProps {
  /** The source owner. */
  source: IHumanViewerWatchedSource;

  /**
   * Adds paths to the watcher.
   *
   * @evidence contracts/common.md#principled-implementation Watcher expansion registers the actual source/input paths selected by the source owner.
   * @evidence contracts/common.md#clear-and-simple-design The host retains the watcher instance while the subscription supplies paths.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Adding paths cannot assign imported-source authority to unrelated files.
   * @evidence contracts/common.md#meaningful-documentation Defines the path-array registration operation.
   */
  add: (files: string[]) => void;

  /**
   * Subscribes to watcher events.
   *
   * @evidence contracts/common.md#principled-implementation Watcher subscription delivers the event and input path to the edit-ordering owner.
   * @evidence contracts/common.md#clear-and-simple-design The host owns event delivery while the subscription owns admitted batch processing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Events do not directly replace loaded browser modules or bypass source hashing.
   * @evidence contracts/common.md#meaningful-documentation Documents watcher registration and the event/path callback.
   */
  watch: (changed: (event: string, input: string) => void) => void;

  /**
   * Rereads the catalogue after an input or generation view change.
   *
   * @evidence contracts/common.md#principled-implementation Input notification rereads catalogue authority after an input or generation-view edit.
   * @evidence contracts/common.md#clear-and-simple-design The catalogue owner retains rescanning while the watcher only requests it.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Rescanning input data does not falsely claim loaded browser code changed.
   * @evidence contracts/common.md#meaningful-documentation Names the input catalogue rescan operation.
   */
  inputs: () => void;

  /**
   * Publishes a source edit that moved revisions.
   *
   * @evidence contracts/common.md#principled-implementation Publication reports changed files beside the domains their computed revisions moved.
   * @evidence contracts/common.md#clear-and-simple-design The revision owner computes movement and the host owns source notification effects.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A file event without digest movement is not fabricated into a changed-domain result.
   * @evidence contracts/common.md#meaningful-documentation Defines changed-file and moved-domain publication inputs.
   */
  publish: (files: string[], moved: string[]) => void;

  /**
   * Reports whether an edit batch is being processed.
   *
   * @evidence contracts/common.md#principled-implementation Updating state reflects whether admitted edit batches are pending or computing.
   * @evidence contracts/common.md#clear-and-simple-design The host retains status storage while the subscription determines its transitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A pending update is not replaced with a timer-based viewer failure verdict.
   * @evidence contracts/common.md#meaningful-documentation Documents the boolean edit-processing status callback.
   */
  updating: (value: boolean) => void;

  /**
   * Tells the browser the browser revision moved.
   *
   * @evidence contracts/common.md#principled-implementation Browser notification follows an actually moved browser-domain revision.
   * @evidence contracts/common.md#clear-and-simple-design The host owns browser candidate/display publication independently of the watcher.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A numerical-only edit does not automatically claim the browser generation moved.
   * @evidence contracts/common.md#meaningful-documentation Defines the browser-source revision notification.
   */
  browser: () => void;

  /**
   * Reports a failure while processing edits.
   *
   * @evidence contracts/common.md#principled-implementation Edit-processing failure is forwarded with its original unknown error value.
   * @evidence contracts/common.md#clear-and-simple-design The host owns error reporting while the subscription preserves failure propagation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed digest or catalogue work is not silently converted into a successful publication.
   * @evidence contracts/common.md#meaningful-documentation Documents the error-value callback for source edit processing.
   */
  error: (error: unknown) => void;

  /**
   * Told, at once, of every edit to a file some build reads or a published basis.
   *
   * @evidence contracts/common.md#principled-implementation The optional reached notification reports an admitted source or published-basis edit immediately.
   * @evidence contracts/common.md#clear-and-simple-design The host owns its reaction while the subscription decides actual reachability.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreached filesystem events cannot trigger this actual-input notification.
   * @evidence contracts/common.md#meaningful-documentation Defines the optional notification for a file read by a build or basis owner.
   */
  reached?: () => void;

  /**
   * Schedules the batch; defaults to a 100 ms timer.
   *
   * @evidence contracts/common.md#principled-implementation Batch scheduling returns cancellation for a pending batch callback.
   * @evidence contracts/common.md#clear-and-simple-design The scheduling host owns timing while the subscription owns which edit batch is pending.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The scheduler coalesces source edits and supplies no viewer-age shutdown or display-restart rule.
   * @evidence contracts/common.md#meaningful-documentation Documents optional cancellable batching and the existing default delay.
   */
  schedule?: (run: () => void) => () => void;
}
