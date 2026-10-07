/**
 * The runtime timer scheduler a worker transport uses to retire lost requests.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Supplies cancellation of deadlines for settled or retired requests.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Separates runtime deadline scheduling from numerical worker evaluation.
 * @author Samchon
 */
export interface IHumanWorkerClock {
  /** Schedule a callback after a delay in milliseconds, returning its timer handle. */
  schedule: (callback: () => void, delayMs: number) => unknown;

  /** Cancel a previously returned timer handle. */
  cancel: (handle: unknown) => void;
}
