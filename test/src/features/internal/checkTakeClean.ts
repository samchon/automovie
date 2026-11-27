import type { AutoMovieMotionHumanPerformance } from "@automovie/motions";

import { assertTakeClean } from "./assertTakeClean";
import type { motionComplaints } from "./motionComplaints";

/**
 * Record a take's verdict faults in a gatherer instead of stopping at them,
 * so one run names every other failed expectation of the same spec too.
 *
 * @param checks The spec's gatherer.
 * @param label What the take is, for the failure message.
 * @param take The placed performance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is recorded and why.
 * @evidence contracts/development/implementation.md#principled-implementation Runs `assertTakeClean` unchanged and records its failure message.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One guarded call.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The report's limits are `assertTakeClean`'s; nothing is relaxed, and the gatherer still fails the spec.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One report pass, as `assertTakeClean`'s.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function checkTakeClean(
  checks: motionComplaints.IGatherer,
  label: string,
  take: AutoMovieMotionHumanPerformance,
): void {
  try {
    assertTakeClean(label, take);
  } catch (error: unknown) {
    checks.check(error instanceof Error ? error.message : String(error), false);
  }
}
