/**
 * Whether a process with this pid exists (signal 0 probe).
 *
 * @evidence contracts/common.md#meaningful-documentation States how liveness is read.
 */
export function isHumanViewerProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}
