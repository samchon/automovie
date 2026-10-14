import type { IProcessOwnershipHost } from "./IProcessOwnershipHost.js";
import { WindowsProcessOwnershipPrograms } from "./WindowsProcessOwnershipPrograms.ts";
import { readNativeProcessIdentity } from "./readNativeProcessIdentity.ts";
import { runWindowsProcessOperation } from "./runWindowsProcessOperation.ts";

/**
 * Compose the actual Node effect host for the public static service. Native identity, Windows snapshot/handle operations and POSIX signals stay here; the controller owns capture state and decides whether they may be requested. No public test mode or foreign-method replacement changes this composition.
 *
 * @evidence contracts/common.md#principled-implementation Composes installed Node filesystem/ps/hidden PowerShell discovery and fixed native Windows programs with root SIGTERM effects.
 * @evidence contracts/common.md#clear-and-simple-design Platform effects stay in this one host while controller state, selector admission and pure result decoders retain their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no public test mode or foreign-method replacement; JSON transport casts rely on the fixed native program and do not independently prove OS behavior.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes actual native composition, platform dispatch and controller-owned permission/identity decisions.
 * @evidence contracts/performance.md#efficient-algorithms Closure creation is fixed work; requested snapshots/native handle sets scale with process counts and discovery/signals retain their actual transport costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned host shares immutable effect functions but every requested current identity/snapshot/stop is a distinct native observation/effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host object retains only function references, and each synchronous native transport/program owns its acquired resources with no permanent process registry here.
 */
export function createNodeProcessOwnershipHost(): IProcessOwnershipHost {
  return {
    windows: process.platform === "win32",
    readIdentity: readNativeProcessIdentity,
    snapshot: (): ReturnType<IProcessOwnershipHost["snapshot"]> =>
      runWindowsProcessOperation(
        WindowsProcessOwnershipPrograms.snapshot,
        {},
      ) as Array<{
        pid: number;
        parentPid: number;
        createdAt: string;
      }>,
    terminateWindows: (
      targets: Parameters<IProcessOwnershipHost["terminateWindows"]>[0],
    ): void => {
      runWindowsProcessOperation(WindowsProcessOwnershipPrograms.stop, {
        targets,
      });
    },
    signal: (pid: number): void => {
      process.kill(pid, "SIGTERM");
    },
  };
}
