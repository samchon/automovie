/**
 * Lifecycle facts read from the original child object the owner spawned.
 * The object itself is the capture key, so another object with the same PID
 * cannot borrow its authority. No method is replaced or called on that object.
 *
 * @author Samchon
 */
export interface IProcessChildObservation {
  /** PID assigned by spawn, absent when no child process was created. */
  readonly pid?: number;

  /** Actual exit code, or null until a code-based exit has been observed. */
  readonly exitCode: number | null;

  /** Actual exit signal, or null until signal-based exit has been observed. */
  readonly signalCode: string | null;
}
