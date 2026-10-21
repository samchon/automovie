import type { IAutoMovieRecoveryCameraSceneBudget } from "@automovie/interface/recovery";

import type { IAutoMovieRecoveryCameraSceneEstimate } from "../structures/image/IAutoMovieRecoveryCameraSceneEstimate";
import type { IAutoMovieRecoveryMapJointFit } from "../structures/image/IAutoMovieRecoveryMapJointFit";
import type { IAutoMovieRecoverySceneWork } from "../structures/image/IAutoMovieRecoverySceneWork";
import type { completeRecoverySceneCheckpoint } from "./completeRecoverySceneCheckpoint";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/**
 * Preserve the last completed initial joint report until seed qualification.
 * Completion calls this observer before and after each fit; a later before call
 * carries the preceding report and is distinguished by phase, not nullness.
 * The private target transfers diagnostics only when the seed is refused.
 *
 * @evidence contracts/common.md#principled-implementation Existing paired completion notifications supply already computed plain fit reports. Prepaid reference transfer preserves their own population and termination without a new solve or an accepted-geometry claim.
 * @evidence contracts/common.md#clear-and-simple-design This observer owns only report-transfer phase and its fixed work; completion owns fitting and the scene clears the temporary report before a successful seed commit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No foreign hook, copied coordinator, extra numerical evaluation, synthetic termination or post-fit charge supplies diagnostics. A failed next admission leaves the preceding completed report intact.
 * @evidence contracts/common.md#meaningful-documentation Defines paired phases, report ownership, setup and per-pair prepayment, target-field absence before a completed report and the separate nullable callback argument and successful clearing by the caller. A converged report can still belong to a refused whole checkpoint.
 * @evidence contracts/performance.md#efficient-algorithms Construction prepays32 fixed metadata visits before acquiring the callback; every before-fit notification prepays64 for the six-limit charge helper and both callback phases. The after-fit notification only validates and transfers a reference, even when the prepaid aggregate cap is now reached.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the completed report without copying scalars, geometry, factors or a trajectory. The next before phase may carry the same previous report and never creates another fit.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Three captured references, one phase flag and one target reference are bounded fixed JS metadata, not numeric buffers or a byte/RSS guarantee. Completion already retains lastJoint during the next fit; replacing its alias adds no numeric report history. The callback expires with seed completion and the caller removes its target reference on acceptance.
 */
export function createRecoverySceneSeedReportObserver(
  target: Pick<IAutoMovieRecoveryCameraSceneEstimate, "refusedSeedJoint">,
  work: IAutoMovieRecoverySceneWork,
  budget: IAutoMovieRecoveryCameraSceneBudget,
): NonNullable<Parameters<typeof completeRecoverySceneCheckpoint>[8]> {
  spendRecoverySceneWork(work, budget, "linearWork", 32);
  let pending: boolean = false;
  return (
    _points: number,
    _observations: number,
    report: IAutoMovieRecoveryMapJointFit | null,
  ): void => {
    if (!pending) {
      spendRecoverySceneWork(work, budget, "linearWork", 64);
      pending = true;
      return;
    }
    if (report === null)
      throw new Error("camera-scene-report: completed seed report required");
    target.refusedSeedJoint = report;
    pending = false;
  };
}
