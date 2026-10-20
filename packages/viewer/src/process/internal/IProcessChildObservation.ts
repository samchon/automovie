/**
 * Lifecycle facts read from the original child object the owner spawned. The object itself is the capture key, so another object with the same PID cannot borrow its authority. No method is replaced or called on that object.
 *
 * @evidence contracts/common.md#principled-implementation Projects the original spawn object's optional pid and observed exit/signal state without invoking or replacing its methods.
 * @evidence contracts/common.md#clear-and-simple-design Three readonly lifecycle facts provide capture/stop admission while native identity discovery remains with the host.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Object identity is the capture key and same pid text on another object grants no authority; these observed fields do not independently pin an OS allocation.
 * @evidence contracts/common.md#meaningful-documentation Members explain absent spawn pid and null versus observed code/signal termination.
 * @evidence contracts/performance.md#efficient-algorithms The projection performs no discovery algorithm or process scan; controller checks use its fixed fields.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the original object can match its weak captured stamp; this type defines no cross-object lifecycle cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Readonly facts borrow the actual child object and acquire no subprocess, file or retained native handle.
 */
export interface IProcessChildObservation {
  /** PID assigned by spawn, absent when no child process was created. */
  readonly pid?: number;

  /** Actual exit code, or null until a code-based exit has been observed. */
  readonly exitCode: number | null;

  /** Actual exit signal, or null until signal-based exit has been observed. */
  readonly signalCode: string | null;
}
