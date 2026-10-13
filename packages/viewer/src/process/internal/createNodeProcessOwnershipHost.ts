import type { IProcessOwnershipHost } from "./IProcessOwnershipHost.js";
import { readNativeProcessIdentity } from "./readNativeProcessIdentity.ts";
import { runWindowsProcessOperation } from "./runWindowsProcessOperation.ts";
import { WindowsProcessOwnershipPrograms } from "./WindowsProcessOwnershipPrograms.ts";

/**
 * Compose the actual Node effect host for the public static service. Native
 * identity, Windows snapshot/handle operations and POSIX signals stay here;
 * the controller owns capture state and decides whether they may be requested.
 * No public test mode or foreign-method replacement changes this composition.
 */
export function createNodeProcessOwnershipHost(): IProcessOwnershipHost {
  return {
    windows: process.platform === "win32",
    readIdentity: readNativeProcessIdentity,
    snapshot: () => runWindowsProcessOperation(WindowsProcessOwnershipPrograms.snapshot, {}) as Array<{
      pid: number; parentPid: number; createdAt: string;
    }>,
    terminateWindows: (targets) => {
      runWindowsProcessOperation(WindowsProcessOwnershipPrograms.stop, { targets });
    },
    signal: (pid) => { process.kill(pid, "SIGTERM"); },
  };
}
