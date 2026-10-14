import type { IHumanViewerStartup } from "./IHumanViewerStartup.js";

/**
 * The startup step `/health` reports and the operation that advances it.
 *
 * @evidence contracts/common.md#principled-implementation A mutable startup record and phase operation publish a named transition together with its observation time.
 * @evidence contracts/common.md#clear-and-simple-design Status and the operation that advances it stay under one startup owner so health and logs read the same phase.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Transition logging reports the supplied startup step without fixture-specific timing or a fabricated ready state.
 * @evidence contracts/common.md#meaningful-documentation Comments identify the current step/time pair and the operation's logging effect.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The startup-controller shape chooses no timing or event-log buffering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Entering a phase is a timestamped log effect, so equal labels do not define an interchangeable completed transition.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The controller holds one status object without handles; its enclosing server owns startup tasks.
 *
 * @author Samchon
 */
export interface IHumanViewerStartupPhase {
  /** The current step and when it began. */
  startup: IHumanViewerStartup;

  /**
   * Enter the named step and log it.
   *
   * @evidence contracts/common.md#principled-implementation Advancing a startup phase changes its name and ISO start time together and emits a STARTUP log line.
   * @evidence contracts/common.md#clear-and-simple-design One operation owns both health-record mutation and transition logging.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The operation records the actual supplied step without sleeping for a predetermined readiness duration.
   * @evidence contracts/common.md#meaningful-documentation The member documents entering and logging a named step; the startup member exposes its current time.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This transition signature selects no logging transport or clock implementation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A phase transition changes observation time and writes a log, so an equal name does not justify sharing its effects.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The transition updates one status object and acquires no retained process or timer handle.
   */
  phase: (name: string) => void;
}
