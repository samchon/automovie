import { spawnSync } from "node:child_process";
import fs from "node:fs";

import { decodeLinuxProcessIdentity } from "./decodeLinuxProcessIdentity.ts";
import { decodePosixProcessIdentity } from "./decodePosixProcessIdentity.ts";
import { resolveProcessIdentityReadError } from "./resolveProcessIdentityReadError.ts";
import { runWindowsProcessOperation } from "./runWindowsProcessOperation.ts";
import { WindowsProcessOwnershipPrograms } from "./WindowsProcessOwnershipPrograms.ts";

/**
 * Read native creation facts for the controller's already-admitted PID. Each
 * platform uses its supported discovery transport; pure decoders own result
 * interpretation. Linux reads boot identity with start ticks, Windows reads a
 * retained process handle, and other POSIX hosts use ps creation dates. This
 * host effect does not grant stop authority or remove POSIX signal races.
 */
export function readNativeProcessIdentity(pid: number): string | null {
  if (process.platform === "win32")
    return runWindowsProcessOperation(WindowsProcessOwnershipPrograms.identity, { pid }) as string | null;
  if (process.platform === "linux") {
    try {
      const stat = fs.readFileSync(`/proc/${pid}/stat`, "utf8");
      const boot = fs.readFileSync("/proc/sys/kernel/random/boot_id", "utf8");
      return decodeLinuxProcessIdentity(boot, stat);
    } catch (error) {
      return resolveProcessIdentityReadError(error);
    }
  }
  return decodePosixProcessIdentity(spawnSync("ps", ["-p", String(pid), "-o", "lstart="], {
    encoding: "utf8",
  }));
}
