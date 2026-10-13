/**
 * Whether a process with this pid exists (signal 0 probe).
 * A refused probe returns false, including a permissions refusal. This PID-only
 * observation supplies no process creation identity or termination authority.
 *
 * @evidence contracts/common.md#meaningful-documentation States how liveness is read.
 * @evidence contracts/common.md#principled-implementation Signal zero probes operating-system access without signalling the process; a refused observation remains false rather than an owned-process claim.
 * @evidence contracts/common.md#clear-and-simple-design One boolean OS probe serves diagnostics while creation identity and termination remain with ProcessOwnership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not select processes by executable name or terminate a PID merely because a liveness probe refused.
 */
export function isHumanViewerProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
