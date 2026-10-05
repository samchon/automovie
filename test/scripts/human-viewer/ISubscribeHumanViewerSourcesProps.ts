import type { IHumanViewerWatchedSource } from "./IHumanViewerWatchedSource";

/**
 * What source watching needs from the host.
 *
 * @evidence contracts/common.md#clear-and-simple-design The host owns the watcher and catalogue; the subscription owns edit ordering.
 * @evidence contracts/common.md#meaningful-documentation Names every callback.
 * @author Samchon
 */
export interface ISubscribeHumanViewerSourcesProps {
  /** The source owner. */
  source: IHumanViewerWatchedSource;

  /** Adds paths to the watcher. */
  add: (files: string[]) => void;

  /** Subscribes to watcher events. */
  watch: (changed: (event: string, input: string) => void) => void;

  /** Rereads the catalogue after an input or generation view change. */
  inputs: () => void;

  /** Publishes a source edit that moved revisions. */
  publish: (files: string[], moved: string[]) => void;

  /** Reports whether an edit batch is being processed. */
  updating: (value: boolean) => void;

  /** Tells the browser the browser revision moved. */
  browser: () => void;

  /** Reports a failure while processing edits. */
  error: (error: unknown) => void;

  /** Schedules the batch; defaults to a 100 ms timer. */
  schedule?: (run: () => void) => () => void;
}
