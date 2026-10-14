import { ProcessOwnership } from "../../process/ProcessOwnership.js";

/**
 * Stop one explicitly owned process identity, including only creation-ordered Windows descendants. The caller retains the OS creation stamp captured at launch or written by the owner; a reused PID is refused before termination.
 *
 * @evidence contracts/common.md#principled-implementation Termination forwards the supplied PID and creation stamp to the canonical ProcessOwnership admission and stop owner.
 * @evidence contracts/common.md#clear-and-simple-design One facade call leaves Windows ancestry/handle and POSIX signalling details with ProcessOwnership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An integer PID alone cannot acquire stop authority; platform identity races remain those documented by the process owner.
 * @evidence contracts/common.md#meaningful-documentation The comment defines explicitly captured creation identity and creation-ordered Windows descendants.
 * @evidence contracts/performance.md#efficient-algorithms This forwarding call adds constant work; native snapshot and termination algorithms belong to ProcessOwnership.
 * @evidence contracts/performance.md#reuse-equivalent-work Stopping is an owned effect and is not cached simply because calls share PID text.
 * @evidence contracts/performance.md#bound-retention-and-release-resources No independent process handle is retained by this adapter and no authority beyond the supplied identity is acquired.
 */
export function killHumanViewerProcess(pid: number, createdAt: string): void {
  ProcessOwnership.stop(pid, createdAt);
}
