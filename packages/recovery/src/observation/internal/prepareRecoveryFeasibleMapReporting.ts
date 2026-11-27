import type {
  IAutoMovieRecoveryCameraMapBudget,
  IAutoMovieRecoveryFeasibleJointOptions,
  IAutoMovieRecoveryFeasibleMapReporting,
  IAutoMovieRecoveryFeasibleMapWork,
  IAutoMovieRecoveryFeasibleReportCapacity,
  IAutoMovieRecoveryMapLandmark,
  IAutoMovieRecoveryMapPose,
} from "@automovie/interface";

import { RecoveryFeasibleCapacityError } from "../RecoveryFeasibleCapacityError";
import { prepareRecoveryFeasibleMapWork } from "./prepareRecoveryFeasibleMapWork";
import { prepareRecoveryFeasibleReportCapacity } from "./prepareRecoveryFeasibleReportCapacity";

/** Admit original map work, then prepay its complete fixed diagnostic transfer. */
export function prepareRecoveryFeasibleMapReporting(
  poses: readonly IAutoMovieRecoveryMapPose[],
  landmarks: readonly IAutoMovieRecoveryMapLandmark[],
  intrinsics: readonly (readonly number[])[],
  budget: IAutoMovieRecoveryCameraMapBudget,
  options: IAutoMovieRecoveryFeasibleJointOptions,
  charge: (work: number) => void,
  capacity?: IAutoMovieRecoveryFeasibleReportCapacity,
): IAutoMovieRecoveryFeasibleMapReporting {
  const work: IAutoMovieRecoveryFeasibleMapWork =
    prepareRecoveryFeasibleMapWork(
      poses,
      landmarks,
      intrinsics,
      budget,
      options,
      charge,
    );
  let reporting: IAutoMovieRecoveryFeasibleReportCapacity | undefined =
    capacity;
  if (reporting === undefined) {
    charge(256);
    reporting = prepareRecoveryFeasibleReportCapacity(
      options.maxResidentLinearEntries,
      options.maxResidentLinearEntries,
      0,
    );
  }
  charge(64);
  if (
    reporting.sceneEntries <= 0 ||
    reporting.fitEntries > reporting.sceneEntries ||
    reporting.fitEntries > options.maxResidentLinearEntries - 512 ||
    reporting.reservedEntries <= 0
  )
    throw new Error("camera-feasible: owned reporting capacity required");
  if (work.retained > reporting.fitEntries)
    throw new RecoveryFeasibleCapacityError("resident");
  charge(1984);
  return { ...work, reporting };
}
