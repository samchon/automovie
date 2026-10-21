import type { IAutoMovieRecoverySceneWork } from "../structures/image/IAutoMovieRecoverySceneWork";
import type { IAutoMovieRecoveryFeasibleReportCapacity } from "../structures/internal/IAutoMovieRecoveryFeasibleReportCapacity";
import type { IAutoMovieRecoverySceneFeasibleRouting } from "../structures/internal/IAutoMovieRecoverySceneFeasibleRouting";
import { prepareRecoveryFeasibleReportCapacity } from "./prepareRecoveryFeasibleReportCapacity";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Acquire scene diagnostic retention inside the existing seed transaction try.
 *
 * @evidence contracts/common.md#principled-implementation An accepted relative pair precedes one report scope covering at most A+1 distinct persisted reports and current raw/encoded/previous/trace overlap under the original declared ceiling.
 * @evidence contracts/common.md#clear-and-simple-design The coordinator calls once before the seed checkpoint. Owned routing records are updated for all later growth/resection/checkpoint/fit owners; the reported declared budget stays intact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No callback-mutated caller record is reread, no cap increases, and setup failure cannot become synthetic completed diagnostics or accepted geometry.
 * @evidence contracts/common.md#meaningful-documentation Prepay256 then publish the context/execution partition. A pair refusal skips this owner; aggregate/capacity errors remain in the coordinator's original catch.
 * @evidence contracts/performance.md#efficient-algorithms Constant scalar capacity arithmetic and one17-field copy cost at most256 visits; no attempt list, report, geometry or history is traversed.
 * @evidence contracts/performance.md#reuse-equivalent-work One scope is borrowed through both checkpoints and every closure fit, with no nested reservation or repeated option snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three context scalars and its routing reference plus the execution copy belong to the512 current envelope. A+1 persisted report envelopes transfer with the result; no caller-owned trace history or byte/RSS guarantee is included.
 */
export function prepareRecoverySceneReportCapacity(
  routing: IAutoMovieRecoverySceneFeasibleRouting,
  work: IAutoMovieRecoverySceneWork,
): void {
  spendRecoverySceneWork(work, routing.execution, "linearWork", 256);
  const reporting: IAutoMovieRecoveryFeasibleReportCapacity =
    prepareRecoveryFeasibleReportCapacity(
      routing.execution.maxResidentLinearEntries,
      routing.feasible.maxResidentLinearEntries,
      routing.declared.maxCameraAttempts + 1,
    );
  routing.execution = {
    ...routing.execution,
    maxResidentLinearEntries: reporting.sceneEntries,
  };
  routing.reporting = reporting;
}
