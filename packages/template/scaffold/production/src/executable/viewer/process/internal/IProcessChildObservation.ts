/**
 * Lifecycle facts read from the original child object the owner spawned. The object itself is the capture key, so another object with the same PID cannot borrow its authority. No method is replaced or called on that object.
 *
 * @evidence contracts/development/design.md#principled-representation Projects the original spawn object's optional pid and observed exit/signal state without invoking or replacing its methods.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three readonly lifecycle facts provide capture/stop admission while native identity discovery remains with the host.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Object identity is the capture key and same pid text on another object grants no authority; these observed fields do not independently pin an OS allocation.
 * @evidence contracts/development/common.md#meaningful-documentation Members explain absent spawn pid and null versus observed code/signal termination.
 */
export interface IProcessChildObservation {
  /** PID assigned by spawn, absent when no child process was created. */
  readonly pid?: number;

  /** Actual exit code, or null until a code-based exit has been observed. */
  readonly exitCode: number | null;

  /** Actual exit signal, or null until signal-based exit has been observed. */
  readonly signalCode: string | null;
}
