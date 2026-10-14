/**
 * A control command's action chosen from observed viewer facts. Reporting uses exit 0 only for readiness and 3 otherwise; refusal carries its ownership cause, while termination carries the already-selected process id.
 *
 * @evidence contracts/common.md#principled-implementation The action discriminator represents planHumanViewerControl's current health/PID decision; only report carries readiness exit 0 or 3 and only kill carries the selected PID.
 * @evidence contracts/common.md#clear-and-simple-design Separates observed absence, a reasoned ownership refusal and a termination plan so the control executor must narrow the action before acting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The union grants no OS permission or process identity guarantee; the executor still checks the selected process creation stamp before termination.
 * @evidence contracts/common.md#meaningful-documentation States readiness exit values, refusal cause and PID ownership; kill means a proposed executor action, not observed process death.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The action record erases at runtime; fixed health/record branches are implemented by planHumanViewerControl, and process discovery remains the executor's cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A stop plan refers to one current health observation and saved record; the schema caches no earlier readiness or process handle.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The plan contains scalar values and an optional reason string, no process handle; native handle acquisition and retirement belong to its executor.
 */
export type HumanViewerControlPlan =
  | { action: "report"; exitCode: 0 | 3 }
  | { action: "absent" }
  | { action: "refuse"; reason: string }
  | { action: "kill"; pid: number };
