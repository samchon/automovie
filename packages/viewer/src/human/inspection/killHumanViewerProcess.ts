import { ProcessOwnership } from "../../process/ProcessOwnership.js";

/**
 * Stop one explicitly owned process identity, including only creation-ordered
 * Windows descendants. The caller retains the OS creation stamp captured at
 * launch or written by the owner; a reused PID is refused before termination.
 */
export function killHumanViewerProcess(pid: number, createdAt: string): void {
  ProcessOwnership.stop(pid, createdAt);
}
