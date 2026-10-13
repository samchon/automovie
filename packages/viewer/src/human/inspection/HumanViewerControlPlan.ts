/**
 * A control command's action chosen from observed viewer facts. Reporting uses exit 0 only for readiness and 3 otherwise; refusal carries its ownership cause, while termination carries the already-selected process id.
 */
export type HumanViewerControlPlan =
  | { action: "report"; exitCode: 0 | 3 }
  | { action: "absent" }
  | { action: "refuse"; reason: string }
  | { action: "kill"; pid: number };
