import type { HumanViewerControlPlan } from "./HumanViewerControlPlan.js";


/**
 * Decide `status` or `stop` for the resident viewer from the health the port answered and the process record this checkout wrote. Status reports and exits 0 only for a ready server. Stop acts on exactly one process: the pid in the record, and only when the answering server reports that same pid, so a server another session or checkout owns, a stale record and a busy port are all refused and never killed. The module has no imports and uses only syntax Node strips, so the control script that applies it starts without the project type check that `ttsx` performs.
 *
 * @evidence contracts/common.md#principled-implementation Status reports actual readiness; stop intent requires the answering PID to match the checkout record.
 * @evidence contracts/common.md#clear-and-simple-design Fixed report/absent/busy/mismatch branches separate observation from termination execution.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Busy or mismatched ownership refuses and a returned kill plan still requires executor creation-stamp checks.
 * @evidence contracts/common.md#meaningful-documentation The comment defines record matching, status exit and plain-Node compatibility rather than completed OS termination.
 * @evidence contracts/performance.md#efficient-algorithms Fixed supplied-fact branches choose no discovery or process-tree algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Decisions consume current supplied facts rather than a cached earlier server answer.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The plan acquires no process handle and its executor owns actual identity admission and retirement.
 */
export function planHumanViewerControl(
  command: "status" | "stop",
  health: { pid: number; ready: boolean } | null | undefined,
  saved: { pid: number } | null,
): HumanViewerControlPlan {
  if (command === "status")
    return { action: "report", exitCode: health?.ready === true ? 0 : 3 };
  if (health === null) return { action: "absent" };
  if (health === undefined)
    return {
      action: "refuse",
      reason: "The port is busy; ownership cannot yet be verified",
    };
  if (saved === null || saved.pid !== health.pid)
    return {
      action: "refuse",
      reason: "The running server is not owned by this checkout",
    };
  return { action: "kill", pid: saved.pid };
}
