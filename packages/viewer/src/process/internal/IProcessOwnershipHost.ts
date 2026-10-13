/**
 * The operating-system effect boundary of one process-ownership controller.
 * Discovery supplies actual creation identities; it never grants permission
 * to stop a process. The caller already owns the target and requests an
 * explicit stop. Windows termination pins and verifies every supplied target
 * before stopping the first one, then stops them in their parent-first order.
 * POSIX signalling remains PID based and cannot claim that atomic guarantee.
 *
 * @author Samchon
 */
export interface IProcessOwnershipHost {
  /** Whether stop must admit a Windows snapshot instead of a POSIX root signal. */
  readonly windows: boolean;

  /**
   * Actual birth stamp, null for absence; operational failures propagate.
   * Discovery supplies a fact for the controller's admitted PID and does not
   * itself grant ownership or permission to stop that process.
   */
  readIdentity(pid: number): string | null;

  /**
   * Current Windows PID, parent PID and microsecond creation observations.
   * The controller's tree owner decides which ancestry is admissible; this
   * snapshot is not an OS-wide namespace lock or captured stop authority.
   */
  snapshot(): ReadonlyArray<{ pid: number; parentPid: number; createdAt: string }>;

  /**
   * Pin and verify the complete admitted set before its first termination.
   * Targets arrive in parent-first order from the controller. Native failures
   * propagate; a later termination failure can leave a partially stopped set.
   */
  terminateWindows(targets: ReadonlyArray<{ pid: number; createdAt: string }>): void;

  /**
   * Request SIGTERM for the checked POSIX root; native PID reuse can still race.
   * The controller checks creation immediately before this PID-based effect.
   * Descendants are not recursively signalled by this boundary.
   */
  signal(pid: number): void;
}
