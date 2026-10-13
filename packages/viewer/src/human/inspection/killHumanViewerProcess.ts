import { ProcessOwnership } from "../../process/ProcessOwnership.js";

/**
 * Stop one explicitly owned process identity, including only creation-ordered
 * Windows descendants. The caller retains the OS creation stamp captured at
 * launch or written by the owner; a reused PID is refused before termination.
 *
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The general process boundary checks creation identities and never selects by process name or taskkill tree traversal.
 * @evidence contracts/common.md#principled-implementation The captured OS creation stamp binds termination to the original process identity rather than the reused integer PID.
 * @evidence contracts/common.md#clear-and-simple-design One adapter delegates platform identity and termination semantics to the shared process owner.
 * @evidence contracts/common.md#meaningful-documentation States the launch-identity precondition and PID-reuse refusal.
 */
export function killHumanViewerProcess(pid: number, createdAt: string): void {
  ProcessOwnership.stop(pid, createdAt);
}
