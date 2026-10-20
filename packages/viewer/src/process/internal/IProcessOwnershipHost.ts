/**
 * The operating-system effect boundary of one process-ownership controller. Discovery supplies actual creation identities; it never grants permission to stop a process. The caller already owns the target and requests an explicit stop. Windows termination pins and verifies every supplied target before stopping the first one, then stops them in their parent-first order. POSIX signalling remains PID based and cannot claim that atomic guarantee.
 *
 * @evidence contracts/common.md#principled-implementation Defines native creation discovery, Windows snapshot/complete-set handle termination and POSIX root signal capabilities for an already owned explicit target.
 * @evidence contracts/common.md#clear-and-simple-design The controller owns identity admission while this port keeps operating-system effects separate from pure typed decision cases.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Discovery is factual rather than permission, Windows snapshot is not a namespace lock and POSIX signalling does not claim atomic handle-based identity protection.
 * @evidence contracts/common.md#meaningful-documentation Comments identify each native effect, creation observations, parent-first input and partial termination/precision limits.
 * @evidence contracts/performance.md#efficient-algorithms The interface chooses no native query implementation; actual snapshot and termination costs scale with discovered/admitted processes in the Node host.
 * @evidence contracts/performance.md#reuse-equivalent-work Creation facts must be current for each requested stop, while original-child expected stamps are shared only by controller capture ownership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The concrete host owns transient process handles/transports and disposes them; the interface itself retains no OS object or background task.
 */
export interface IProcessOwnershipHost {
  /** Whether stop must admit a Windows snapshot instead of a POSIX root signal. */
  readonly windows: boolean;

  /**
   * Actual birth stamp, null for absence; operational failures propagate. Discovery supplies a fact for the controller's admitted PID and does not itself grant ownership or permission to stop that process.
   *
   * @evidence contracts/common.md#principled-implementation Reads the native birth stamp for an already admitted positive pid, returning null only for absence and propagating operational failure.
   * @evidence contracts/common.md#clear-and-simple-design The discovery capability supplies facts while the controller decides identity/ownership admission.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The returned stamp cannot itself authorize stopping an unowned process and no fabricated fallback birth is allowed.
   * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes native observation, absence, operational failure and lack of permission grant.
   * @evidence contracts/performance.md#efficient-algorithms Implementation cost belongs to actual platform file/ps/handle discovery rather than this method signature.
   * @evidence contracts/performance.md#reuse-equivalent-work Current allocation facts must be read rather than cached solely by a pid that can be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Concrete discovery owns its temporary transport/handle and returns only a stamp string; this borrowed capability retains no process.
   */
  readIdentity(pid: number): string | null;

  /**
   * Current Windows PID, parent PID and microsecond creation observations. The controller's tree owner decides which ancestry is admissible; this snapshot is not an OS-wide namespace lock or captured stop authority.
   *
   * @evidence contracts/common.md#principled-implementation Supplies immutable observed Windows process ids, parent ids and microsecond birth stamps for one tree admission round.
   * @evidence contracts/common.md#clear-and-simple-design Snapshot acquisition stays behind the native host while pure ancestry selection consumes its records.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A snapshot is neither an OS namespace lock nor original-child capture authority and cannot include every child spawned after its observation.
   * @evidence contracts/common.md#meaningful-documentation The member describes Windows fields, precision and snapshot-versus-authority limitations.
   * @evidence contracts/performance.md#efficient-algorithms Acquisition and returned storage scale with OS process population; tree selection incurs its own admitted-parent comparisons.
   * @evidence contracts/performance.md#reuse-equivalent-work A call consumes one snapshot consistently, but later stop operations cannot reuse it as current allocation truth without handle checks.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The host returns value records rather than retained Process handles; its discovery subprocess/transport must end before returning.
   */
  snapshot(): ReadonlyArray<{
    pid: number;
    parentPid: number;
    createdAt: string;
  }>;

  /**
   * Pin and verify the complete admitted set before its first termination. Targets arrive in parent-first order from the controller. Native failures propagate; a later termination failure can leave a partially stopped set.
   *
   * @evidence contracts/common.md#principled-implementation Requires the full admitted parent-first set and pins/checks every current creation identity before the first native termination.
   * @evidence contracts/common.md#clear-and-simple-design The host owns native handles and effects while the controller/tree owner supplies the exact target set.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No supplied target is widened by an OS recursive-kill switch; all preflight checks precede effects, while later native failure may still leave partial termination.
   * @evidence contracts/common.md#meaningful-documentation Documentation states complete-set preflight, parent-first order and possible partial failure after termination starts.
   * @evidence contracts/performance.md#efficient-algorithms For T targets, handle acquisition/comparison and termination are O(T) host effects plus actual OS wait duration.
   * @evidence contracts/performance.md#reuse-equivalent-work Pinned handles retain allocation identity within this effect; an earlier snapshot alone does not replace checking each supplied expected stamp.
   * @evidence contracts/performance.md#bound-retention-and-release-resources All acquired handles are disposed in the concrete host's finally, including admission/termination failures; completion must not be inferred from merely enumerating targets.
   */
  terminateWindows(
    targets: ReadonlyArray<{ pid: number; createdAt: string }>,
  ): void;

  /**
   * Request SIGTERM for the checked POSIX root; native PID reuse can still race. The controller checks creation immediately before this PID-based effect. Descendants are not recursively signalled by this boundary.
   *
   * @evidence contracts/common.md#principled-implementation Requests SIGTERM only for the checked owned POSIX root, preserving the existing pid-based native effect.
   * @evidence contracts/common.md#clear-and-simple-design Current creation checking stays with the controller and this host method performs the one signal.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The signal does not recursively adopt descendants and the interval between birth check and pid signal remains a race.
   * @evidence contracts/common.md#meaningful-documentation Documentation identifies root-only SIGTERM and the non-atomic POSIX admission/effect boundary.
   * @evidence contracts/performance.md#efficient-algorithms One native signal request is fixed adapter work, with actual process shutdown duration outside this method.
   * @evidence contracts/performance.md#reuse-equivalent-work A signal is an individual requested effect and cannot be reused merely because a prior pid or creation string matched.
   * @evidence contracts/performance.md#bound-retention-and-release-resources No persistent handle is acquired by the pid signal; process exit must be observed by its lifecycle owner rather than assumed from request completion.
   */
  signal(pid: number): void;
}
