/**
 * The process record a resident viewer writes as soon as it owns its port
 * (right after the public listener starts, before the page can draw),
 * under its selected mutable storage in the file its port names, so `status` and
 * `stop` can verify ownership of a server that is still starting. Only a record whose pid
 * equals the pid the answering server reports and whose OS creation stamp
 * still identifies that process can authorize termination.
 *
 * @evidence contracts/common.md#principled-implementation The live public-port PID selects the recorded owner and its OS creation stamp protects against PID reuse.
 * @evidence contracts/common.md#meaningful-documentation States where the record lives and what it proves.
 *
 * @evidence contracts/common.md#clear-and-simple-design Port, live PID and OS creation identity jointly identify one owner without storing its process tree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent legacy creation stamps cannot authorize termination, and PID reuse cannot inherit another process's ownership.
 *
 * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner The live public-port PID selects the recorded owner and its OS creation stamp protects against PID reuse.
 * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Absent legacy creation stamps cannot authorize termination, and PID reuse cannot inherit another process's ownership.
 *
 * @author Samchon
 */
export interface IHumanViewerRecord {
  /**
   * Public-port owner: the launcher PID, or server.mts when started directly.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Records the actual public-port owner rather than selecting a process by executable name.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Records the actual public-port owner rather than selecting a process by executable name.
   */
  pid: number;

  /**
   * OS creation identity; absent in old records, which cannot authorize stop.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Retains OS creation identity for PID-reuse protection; absence in an old record cannot authorize termination.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Retains OS creation identity for PID-reuse protection; absence in an old record cannot authorize termination.
   */
  processStartedAt?: string;

  /**
   * ISO time at which the public listener began owning its port.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Records when the listener acquired the port rather than deriving ownership from uptime.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Records when the listener acquired the port rather than deriving ownership from uptime.
   */
  startedAt: string;

  /**
   * Public port owned by the recorded process.
   *
   * @evidence requirements/operations-and-recovery/concurrent-runs-and-locking.md#operations-lock-scope-owner Binds the ownership record to the exact public listener selected by status or explicit stop.
   * @evidence specifications/execution-and-recovery/concurrent-ownership-and-locking.md#execution-claim-scope-owner Binds the ownership record to the exact public listener selected by status or explicit stop.
   */
  port: number;
}
