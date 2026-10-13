/**
 * Lifecycle facts read from the original child object the owner spawned.
 * The object itself is the capture key, so another object with the same PID
 * cannot borrow its authority. No method is replaced or called on that object.
 *
 * @evidence contracts/common.md#principled-implementation Original child-object identity and observed exit/signal facts remain independent of an integer PID's current allocation.
 * @evidence contracts/common.md#clear-and-simple-design Contains only the lifecycle facts required to capture and stop the owned child.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses observations instead of mutating a foreign ChildProcess object or synthesizing an OS handle.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes the original capture key from PID allocation and describes each lifecycle field.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Keeps original owned-child lifecycle observations separate from process-ID discovery.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Supplies the ownership controller with the actual child lifecycle fields it reads.
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
