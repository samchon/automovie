/** What the viewer's control script should do for one command, decided from facts it has read. */
export type HumanViewerControlPlan =
  | { action: "report"; exitCode: 0 | 3 }
  | { action: "absent" }
  | { action: "refuse"; reason: string }
  | { action: "kill"; pid: number };

/**
 * Decide `status` or `stop` for the resident viewer from the health the port
 * answered and the process record this checkout wrote. Status reports and
 * exits 0 only for a ready server. Stop acts on exactly one process: the pid in
 * the record, and only when the answering server reports that same pid, so a
 * server another session or checkout owns, a stale record and a busy port are
 * all refused and never killed. The module has no imports and uses only syntax
 * Node strips, so the control script that applies it starts without the
 * project type check that `ttsx` performs.
 *
 * @evidence contracts/common.md#principled-implementation Ownership is proven by equality of the recorded pid and the pid the live server reports.
 * @evidence contracts/common.md#clear-and-simple-design One pure decision serves the node-strippable control script.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No process is selected by name and no pid comes from anywhere but the record.
 * @evidence contracts/common.md#meaningful-documentation States ownership, refusal reasons and why the module has no imports.
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
