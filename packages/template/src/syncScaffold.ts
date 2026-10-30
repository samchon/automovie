import type { IScaffoldPublicationReceipt } from "./IScaffoldPublicationReceipt";
import type { IScaffoldSyncPlan } from "./IScaffoldSyncPlan";
import type { IScaffoldSyncProps } from "./IScaffoldSyncProps";
import { planScaffoldSync } from "./planScaffoldSync";
import { publishFiles } from "./publishFiles";

/**
 * Applies an explicit, conflict-free generated-instruction update.
 *
 * @evidence contracts/common.md#principled-implementation A complete fresh plan precedes any write; current-generation preconditions bind replacements, and the baseline is published only after all content succeeds.
 * @evidence contracts/common.md#clear-and-simple-design This coordinator reuses the existing publication receipts and native file ownership checks rather than implement another writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Dry runs and any conflict write nothing; partial publication retains its truthful receipt and is never retried or rolled back.
 * @evidence contracts/common.md#meaningful-documentation The result distinguishes conflicted, planned, unchanged and actual publication outcomes, including every retained retired path.
 * @evidence contracts/performance.md#efficient-algorithms Planning dominates byte scans; publication writes/readbacks only changed files and the final state.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged instructions are omitted from the candidate; effectful publication and filesystem planning are never reused across calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives the plan and optional receipt; mature publication owners attempt descriptor release and preserve close/partial failures.
 */
export function syncScaffold(props: IScaffoldSyncProps): {
  status:
    | "conflicted"
    | "planned"
    | "unchanged"
    | IScaffoldPublicationReceipt["status"];
  plan: IScaffoldSyncPlan;
  receipt?: IScaffoldPublicationReceipt;
} {
  const plan: IScaffoldSyncPlan = planScaffoldSync(props);
  if (plan.conflicts.length > 0) return { status: "conflicted", plan };
  if (props.check) return { status: "planned", plan };
  if (Object.keys(plan.files).length === 0)
    return { status: "unchanged", plan };
  const receipt: IScaffoldPublicationReceipt = publishFiles(
    plan.location,
    plan.files,
    { force: true, expected: plan.expected },
  );
  return { status: receipt.status, plan, receipt };
}
