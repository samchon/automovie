/**
 * A control command's action chosen from observed viewer facts. Reporting uses exit 0 only for readiness and 3 otherwise; refusal carries its ownership cause, while termination carries the already-selected process id.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated command result separates reporting, absence, refusal and termination so control dispatch receives only the fields its action needs.
 * @evidence contracts/common.md#clear-and-simple-design Refusal reasons and termination PIDs occur only on their respective action alternatives.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The kill alternative names an observed PID; the plan supplies no age-based or guessed process identity.
 * @evidence contracts/common.md#meaningful-documentation Report exit codes belong to reporting, refusal carries its cause, and kill carries the already-elected process identity.
 */
export type HumanViewerControlPlan =
  | { action: "report"; exitCode: 0 | 3 }
  | { action: "absent" }
  | { action: "refuse"; reason: string }
  | { action: "kill"; pid: number };
