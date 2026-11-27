import { AutoMovieRecoveryFeasibleCapacityError, AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `prepareRecoveryFeasibleReportCapacity` reserves 512 scene entries for each
 * persisted report and one more, and leaves the fit 512 entries short of its
 * own limit, never above the scene's remainder.
 *
 * Scenarios:
 *
 * 1. 4096 scene, 2048 fit, 1 report: 1024 reserved, 3072 scene, 1536 fit.
 * 2. 1600 scene, 4096 fit, 0 reports: 512 reserved, 1088 scene, 1088 fit.
 * 3. 2048 scene, 3 reports reserve all 2048: a resident capacity error.
 * 4. A zero scene is refused.
 */
export function test_recovery_internal_prepare_feasible_report_capacity(): void {
  TestValidator.equals(
    "the fit's own limit",
    AutoMovieRecoveryCameraMap.prepareFeasibleReportCapacity(4096, 2048, 1),
    { sceneEntries: 3072, fitEntries: 1536, reservedEntries: 1024 },
  );
  TestValidator.equals(
    "the scene's remainder",
    AutoMovieRecoveryCameraMap.prepareFeasibleReportCapacity(1600, 4096, 0),
    { sceneEntries: 1088, fitEntries: 1088, reservedEntries: 512 },
  );
  let reason: string | null = null;
  try {
    AutoMovieRecoveryCameraMap.prepareFeasibleReportCapacity(2048, 2048, 3);
  } catch (error) {
    if (error instanceof AutoMovieRecoveryFeasibleCapacityError) reason = error.reason;
  }
  TestValidator.equals("everything reserved", reason, "resident");
  TestValidator.error("a zero scene", (): unknown =>
    AutoMovieRecoveryCameraMap.prepareFeasibleReportCapacity(0, 2048, 0),
  );
}
