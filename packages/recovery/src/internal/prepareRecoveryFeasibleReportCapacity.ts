import type { IAutoMovieRecoveryFeasibleReportCapacity } from "../structures/internal/IAutoMovieRecoveryFeasibleReportCapacity";
import { RecoveryFeasibleCapacityError } from "./RecoveryFeasibleCapacityError";

/**
 * Partition one reporting scope before growth or joint scratch is formed.
 *
 * @evidence contracts/common.md#principled-implementation Each distinct persisted report receives512 logical slots, and one current-operation512 envelope covers raw/encoded overlap, a previous checkpoint and a producer trace clone under unchanged limits.
 * @evidence contracts/common.md#clear-and-simple-design The scene acquires once inside its seed try after relative-pair acceptance, then passes the context through every growth/resection/checkpoint/fit stage. Direct checkpoint or camera calls establish their own zero-persisted scope after their original gauge preflight.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No raised cap, double reservation, report deletion, numerical gate change or assumed free128 fit shell supplies space.
 * @evidence contracts/common.md#meaningful-documentation Counts logical scalar/reference entries, excluding JS headers and byte/RSS claims. Nonpositive fit capacity remains a later valid population refusal after original fit configuration/gauge checks.
 * @evidence contracts/performance.md#efficient-algorithms Fixed validation, arithmetic and three stores are prepaid by the outer owner's256 setup visits; there is no report/attempt scan.
 * @evidence contracts/performance.md#reuse-equivalent-work The admitted context serves every nested closure fit without repeated snapshots or reservation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The current512 envelope includes this three-field record, additional budget/options snapshots and fixed scratch. Persisted reports and trace clones use their distinct envelopes; external observer history remains caller-owned.
 */
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
