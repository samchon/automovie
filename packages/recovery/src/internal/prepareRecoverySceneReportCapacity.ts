import type {
  IAutoMovieRecoveryFeasibleReportCapacity,
  IAutoMovieRecoverySceneFeasibleRouting,
  IAutoMovieRecoverySceneWork,
} from "@automovie/interface";

import { prepareRecoveryFeasibleReportCapacity } from "./prepareRecoveryFeasibleReportCapacity";
import { spendRecoverySceneWork } from "./spendRecoverySceneWork";

/** Acquire scene diagnostic retention inside the existing seed transaction try. */
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
