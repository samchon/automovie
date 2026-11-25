import { disarmed } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * The `disarmed` law's anchor cues (`disarmed.instant`): the defender's named
 * cue on the film clock, at the disarm's start plus its share of the plan.
 *
 * Scenario: a 4 s disarm placed at 2 s with `taken` halfway is taken at 4 s; it
 * has no `gripped`.
 */
export function test_motions_grappling_disarmed(): void {
  const placed: Parameters<typeof disarmed.instant>[0] = {
    start: 2,
    plan: { events: [{ name: "taken", share: 0.5 }], duration: 4 },
  };
  TestValidator.equals(
    "the cues",
    [disarmed.instant(placed, "taken"), disarmed.instant(placed, "gripped")],
    [4, undefined],
  );
}
