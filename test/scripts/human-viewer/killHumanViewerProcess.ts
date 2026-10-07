import { spawnSync } from "node:child_process";

/**
 * Stop one process and its children: the whole tree on Windows (taskkill /T /F,
 * hidden), SIGTERM elsewhere. Callers pass only a pid they own or verified.
 *
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Kills only the given pid tree, never by process name.
 * @evidence contracts/common.md#meaningful-documentation States the platform behaviour and the ownership precondition.
 */
export function killHumanViewerProcess(pid: number): void {
  if (process.platform === "win32")
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], {
      windowsHide: true,
      stdio: "ignore",
    });
  else process.kill(pid, "SIGTERM");
}
