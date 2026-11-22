import { HumanPerformance } from "@automovie/motions";

import { assertTakeClean } from "./assertTakeClean";

/**
 * The shipped take verdicts over a take, recorded as a complaint rather
 * than thrown, so one run reads every take of a spec.
 *
 * @param label What the take is.
 * @param take The take.
 * @param failures Where a fault is recorded.
 */
export function collectTakeClean(
  label: string,
  take: HumanPerformance,
  failures: string[],
): void {
  try {
    assertTakeClean(label, take);
  } catch (error) {
    failures.push(error instanceof Error ? error.message : String(error));
  }
}
