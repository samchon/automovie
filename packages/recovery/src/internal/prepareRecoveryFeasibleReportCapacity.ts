import type { IAutoMovieRecoveryFeasibleReportCapacity } from "@automovie/interface";

import { RecoveryFeasibleCapacityError } from "./RecoveryFeasibleCapacityError";

/** Partition one reporting scope before growth or joint scratch is formed. */
export function prepareRecoveryFeasibleReportCapacity(
  sceneEntries: number,
  fitEntries: number,
  persistedReports: number,
): IAutoMovieRecoveryFeasibleReportCapacity {
  const reservedEntries: number = 512 * (persistedReports + 1);
  if (
    !Number.isSafeInteger(sceneEntries) ||
    sceneEntries <= 0 ||
    !Number.isSafeInteger(fitEntries) ||
    fitEntries <= 0 ||
    !Number.isSafeInteger(persistedReports) ||
    persistedReports < 0 ||
    !Number.isSafeInteger(reservedEntries)
  )
    throw new Error("camera-feasible: safe fixed reporting scope required");
  if (reservedEntries >= sceneEntries)
    throw new RecoveryFeasibleCapacityError("resident");
  return {
    sceneEntries: sceneEntries - reservedEntries,
    fitEntries: Math.min(fitEntries - 512, sceneEntries - reservedEntries),
    reservedEntries,
  };
}
