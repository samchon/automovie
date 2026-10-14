/**
 * Whether a process with this pid exists (signal 0 probe). A refused probe returns false, including a permissions refusal. This PID-only observation supplies no process creation identity or termination authority.
 *
 * @evidence contracts/common.md#principled-implementation A signal-zero probe observes whether this PID can currently be addressed and returns false when that probe refuses.
 * @evidence contracts/common.md#clear-and-simple-design One guarded process.kill call implements PID liveness without another process-record authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Permission refusal is not certified as absence, and PID-only liveness does not authorize killing a process with a reused identity.
 * @evidence contracts/common.md#meaningful-documentation The comment defines signal-zero semantics and separates liveness from creation identity and termination ownership.
 * @evidence contracts/performance.md#efficient-algorithms One operating-system probe chooses no process-tree traversal or collection algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Liveness is observed on each call and no earlier probe is cached as current process authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The probe acquires no persistent process handle or listener and retains no observation history.
 */
export function isHumanViewerProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
