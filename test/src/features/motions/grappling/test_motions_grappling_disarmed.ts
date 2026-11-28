import {
  disarmed
} from "../../../../../packages/motions/src/grappling/internal/disarmed";
import { TestValidator } from "@nestia/e2e";

/**
 * Check how a disarm plan exposes event seconds on the film clock.
 *
 * Scenarios:
 *
 * 1. A four-second plan placed at 2 s reports `taken` at 4 s when its event
 *    share is one half.
 * 2. The same plan has no `gripped` event and the read returns `undefined` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the placed start, normalized share and missing event result.
 * @evidence contracts/development/testing.md#behavioral-verification The instant reader takes a plan with one named event and queries two names.
 * @evidence contracts/development/testing.md#independent-expectations Film time is the placed start plus duration times event share.
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
