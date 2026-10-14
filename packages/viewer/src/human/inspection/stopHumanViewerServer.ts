import type { IHumanShotContext } from "./IHumanShotContext.js";
import type { IHumanViewerProbe } from "./IHumanViewerProbe.js";
import { killHumanViewerProcess } from "./killHumanViewerProcess.js";
import { readHumanViewerRecord } from "./readHumanViewerRecord.js";

/**
 * Stop this checkout's viewer on the port: only when the answering server reports the pid this port's record names and its recorded OS creation stamp identifies the live process, so a server another session or checkout owns, a stale record and a busy port are all refused and never killed. An absent viewer is reported, not an error. The terminated owner's record remains, because deleting after the port is free could remove a replacement owner's record. The next listener replaces it after binding.
 *
 * @evidence contracts/common.md#principled-implementation Requires answering health pid, matching port record and recorded OS creation identity before delegating explicit termination to the process owner.
 * @evidence contracts/common.md#clear-and-simple-design Discovery/record checks stay in this command while platform identity, tree admission and signalling remain with ProcessOwnership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unanswered or unrelated busy port is refused, a legacy stamp-less record has no stop authority and the terminated owner's record is retained to avoid deleting a replacement's record.
 * @evidence contracts/common.md#meaningful-documentation Documentation describes ownership checks, absent-viewer reporting and why record deletion cannot follow freeing the port.
 * @evidence contracts/performance.md#efficient-algorithms Record read/check work is fixed apart from its JSON bytes, with native discovery/termination cost delegated to the platform owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Current health and creation identity are checked for this stop effect; a previous pid or matching origin cannot be reused as ownership authority.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The command acquires no persistent child handle and stops only the identity-admitted process; uncertainty in native termination remains the platform owner's reported failure.
 */
export function stopHumanViewerServer(
  context: IHumanShotContext,
  probe: IHumanViewerProbe,
): void {
  if (probe.health === null) {
    console.log("human-viewer absent");
    return;
  }
  if (probe.health === undefined)
    throw new Error("The port is busy; ownership cannot yet be verified");
  const saved: ReturnType<typeof readHumanViewerRecord> = readHumanViewerRecord(
    context.record,
  );
  if (
    saved === null ||
    saved.pid !== probe.health.pid ||
    saved.port !== context.port
  )
    throw new Error("The running server is not owned by this checkout");
  if (!saved.processStartedAt)
    throw new Error(
      "The process record lacks a creation identity; stop refused",
    );
  killHumanViewerProcess(saved.pid, saved.processStartedAt);
}
