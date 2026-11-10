import { spawnSync } from "node:child_process";
import fs from "node:fs";

import { WindowsProcessOwnershipPrograms } from "./WindowsProcessOwnershipPrograms.js";
import { decodeLinuxProcessIdentity } from "./decodeLinuxProcessIdentity.js";
import { decodePosixProcessIdentity } from "./decodePosixProcessIdentity.js";
import { resolveProcessIdentityReadError } from "./resolveProcessIdentityReadError.js";
import { runWindowsProcessOperation } from "./runWindowsProcessOperation.js";

/**
 * Read native creation facts for the controller's already-admitted PID. Each platform uses its supported discovery transport; pure decoders own result interpretation. Linux reads boot identity with start ticks, Windows reads a retained process handle, and other POSIX hosts use ps creation dates. This host effect does not grant stop authority or remove POSIX signal races.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Dispatches admitted pid discovery to the fixed Windows program, Linux proc stat plus boot_id decoder or actual ps lstart result on other POSIX platforms.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Platform IO composition retains the existing pure decoders and error classifier, while selector admission, capture authority and stop effects remain with the controller.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only ENOENT from the selected process stat read means absence; boot identity and other Linux failures propagate, and POSIX birth precision/check-to-signal races remain explicit. Fixed Windows JSON result casting is not live OS proof.
 * @evidence contracts/development/common.md#meaningful-documentation Documents each platform producer, already-admitted-selector premise and lack of stop permission or independent lifecycle settlement from discovery.
 * @evidence contracts/development/implementation.md#efficient-algorithms One requested identity uses one platform query; Linux text reads/decoding scale with their native record bytes, while synchronous ps/PowerShell has actual process startup and wait cost.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every call observes current creation facts without a pid-only memo; boot/start changes remain distinct even when pid text is equal.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Synchronous transports own and finish their subprocess/read scope and decoded values hold no permanent handle; no process registry is retained by this function.
 */
export function readNativeProcessIdentity(pid: number): string | null {
  if (process.platform === "win32")
    return runWindowsProcessOperation(
      WindowsProcessOwnershipPrograms.identity,
      { pid },
    ) as string | null;
  if (process.platform === "linux") {
    let stat: string;
    try {
      stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
    } catch (error) {
      return resolveProcessIdentityReadError(error);
    }
    const boot: string = fs.readFileSync(
      "/proc/sys/kernel/random/boot_id",
      "utf8",
    );
    return decodeLinuxProcessIdentity(boot, stat);
  }
  return decodePosixProcessIdentity(
    spawnSync("ps", ["-p", String(pid), "-o", "lstart="], {
      encoding: "utf8",
    }),
  );
}
