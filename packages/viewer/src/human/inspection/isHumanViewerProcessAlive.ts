/**
 * Whether a process with this pid exists (signal 0 probe).
 * A refused probe returns false, including a permissions refusal. This PID-only
 * observation supplies no process creation identity or termination authority.
 */
export function isHumanViewerProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
