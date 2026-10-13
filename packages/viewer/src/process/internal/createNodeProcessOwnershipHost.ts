import type { IProcessOwnershipHost } from "./IProcessOwnershipHost.js";
import { readNativeProcessIdentity } from "./readNativeProcessIdentity.ts";
import { runWindowsProcessOperation } from "./runWindowsProcessOperation.ts";
import { WindowsProcessOwnershipPrograms } from "./WindowsProcessOwnershipPrograms.ts";

/**
 * Compose the actual Node effect host for the public static service. Native
 * identity, Windows snapshot/handle operations and POSIX signals stay here;
 * the controller owns capture state and decides whether they may be requested.
 * No public test mode or foreign-method replacement changes this composition.
 *
 * @evidence contracts/common.md#principled-implementation Connects the canonical controller to supported native discovery and termination effects with the real platform selector.
 * @evidence contracts/common.md#clear-and-simple-design One production composition owns the native effect port supplied to the public facade.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses maintained effects without changing OS methods or exposing test-only options.
 * @evidence contracts/common.md#meaningful-documentation States controller-versus-host responsibilities and canonical production composition.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Supplies the actual session host effects without expanding ownership authority.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Composes native discovery and termination behind the public ProcessOwnership service.
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
