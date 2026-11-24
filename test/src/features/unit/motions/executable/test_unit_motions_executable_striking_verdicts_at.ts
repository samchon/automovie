import { StrikingVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `StrikingVerdicts.at` reads a segment's named event as a film second: the
 * segment's start plus the event's share of the plan's duration.
 *
 * Scenarios:
 *
 * 1. A launch at a quarter of a 2 s plan starting at 1 s lands at 1.5 s.
 * 2. An event the plan lacks reads undefined.
 */
export function test_unit_motions_executable_striking_verdicts_at(): void {
  const segment: StrikingVerdicts.ITimed = {
    start: 1,
    end: 3,
    plan: { duration: 2, events: [{ name: "launch", share: 0.25 }] },
  };
  TestValidator.equals(
    "the event's second, or none",
    [
      StrikingVerdicts.at(segment, "launch"),
      StrikingVerdicts.at(segment, "contact"),
    ],
    [1.5, undefined],
  );
}
