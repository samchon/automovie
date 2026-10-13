/**
 * The operating-system effect boundary of one process-ownership controller.
 * Discovery supplies actual creation identities; it never grants permission
 * to stop a process. The caller already owns the target and requests an
 * explicit stop. Windows termination pins and verifies every supplied target
 * before stopping the first one, then stops them in their parent-first order.
 * POSIX signalling remains PID based and cannot claim that atomic guarantee.
 *
 * @evidence contracts/common.md#principled-implementation Separates observed creation facts and platform effects from the controller's identity admission and child-lifecycle decisions.
 * @evidence contracts/common.md#clear-and-simple-design The host exposes only discovery and termination operations actually consumed by the ownership controller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defines a production-owned effect port rather than replacing foreign process or filesystem methods.
 * @evidence contracts/common.md#meaningful-documentation States stop authority, native handle ordering and the POSIX signal limitation at the host boundary.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation The host isolates actual OS effects from process identity admission without granting authority over other sessions.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Defines discovery and platform termination effects consumed by the session-owned controller.
 * @author Samchon
 */
export interface IProcessOwnershipHost {
  /** Whether stop must admit a Windows snapshot instead of a POSIX root signal. */
  readonly windows: boolean;

  /**
   * Actual birth stamp, null for absence; operational failures propagate.
   * Discovery supplies a fact for the controller's admitted PID and does not
   * itself grant ownership or permission to stop that process.
   *
   * @evidence contracts/common.md#principled-implementation Supplies the current OS creation identity, distinguishes absence with null, and leaves operational discovery failures intact.
   * @evidence contracts/common.md#clear-and-simple-design One identity lookup supplies both original-child capture and later explicit-stop admission without owning either decision.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Discovery cannot grant authority or replace a native birth identity with a name, inferred age or fabricated fallback stamp.
   * @evidence contracts/common.md#meaningful-documentation States the admitted-selector role, absent null, original failure propagation and separation from termination permission.
   */
  readIdentity(pid: number): string | null;

  /**
   * Current Windows PID, parent PID and microsecond creation observations.
   * The controller's tree owner decides which ancestry is admissible; this
   * snapshot is not an OS-wide namespace lock or captured stop authority.
   *
   * @evidence contracts/common.md#principled-implementation Retains actual PID, parent PID and exact creation observations needed to reject a stale parent allocation.
   * @evidence contracts/common.md#clear-and-simple-design Enumeration supplies one snapshot while creation-order traversal and root admission remain with the controller's tree owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplies native ancestry observations instead of selecting a tree by executable name or assuming PID occupancy proves ownership.
   * @evidence contracts/common.md#meaningful-documentation Names Windows creation precision and explains that an observed snapshot supplies neither a namespace lock nor termination authority.
   */
  snapshot(): ReadonlyArray<{ pid: number; parentPid: number; createdAt: string }>;

  /**
   * Pin and verify the complete admitted set before its first termination.
   * Targets arrive in parent-first order from the controller. Native failures
   * propagate; a later termination failure can leave a partially stopped set.
   *
   * @evidence contracts/common.md#principled-implementation Retained process handles and checked creation stamps pin every supplied target before the first native termination.
   * @evidence contracts/common.md#clear-and-simple-design One Windows effect consumes the already admitted parent-first set; snapshot discovery and tree selection remain outside this operation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Individual checked handles define the boundary, so no recursive taskkill expansion, process-name selection or guessed creation identity extends it.
   * @evidence contracts/common.md#meaningful-documentation States all-handles-before-first-stop ordering, caller-supplied order and propagation of native failures including partial termination.
   */
  terminateWindows(targets: ReadonlyArray<{ pid: number; createdAt: string }>): void;

  /**
   * Request SIGTERM for the checked POSIX root; native PID reuse can still race.
   * The controller checks creation immediately before this PID-based effect.
   * Descendants are not recursively signalled by this boundary.
   *
   * @evidence contracts/common.md#principled-implementation Uses the supported POSIX SIGTERM operation after the controller's creation check while retaining the non-atomic native check/signal limitation.
   * @evidence contracts/common.md#clear-and-simple-design One root signal is separate from discovery, Windows snapshots and descendant-handle termination.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither a process name nor unchecked descendant traversal broadens the root signal, and the port makes no atomic PID-reuse protection claim.
   * @evidence contracts/common.md#meaningful-documentation States the checked-root precondition, SIGTERM meaning, absence of recursive signalling and the remaining PID-reuse race.
   */
  signal(pid: number): void;
}
