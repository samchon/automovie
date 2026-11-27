import type {
  IAutoMovieRecoveryMapJointFit,
  IAutoMovieRecoverySceneSeedReportObserverCreationOperation,
} from "@automovie/interface";

import { spendRecoverySceneWork } from "../../internal/spendRecoverySceneWork";

/**
 * Preserve the last completed initial joint report until seed qualification.
 * Completion calls this observer before and after each fit; a later before call
 * carries the preceding report and is distinguished by phase, not nullness. The
 * private target transfers diagnostics only when the seed is refused.
 */
export function createRecoverySceneSeedReportObserver(
  target: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[0],
  work: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[1],
  budget: Parameters<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation>[2],
): ReturnType<IAutoMovieRecoverySceneSeedReportObserverCreationOperation.Operation> {
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
