import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { lieTogetherScene } from "../../internal/lieTogetherScene";

/**
 * Spooning: both lying on the left side, the performer's chest on the partner's
 * upper back, on its own: the `spoon` way of `test_motion_sleep_lie_together`,
 * the average man with the small woman, entered by the minimal chain the
 * partner's lieDown, the performer's stand > lieDown (the grammar has no entry
 * state; each body's lying place is read once from its own lie alone to stage
 * the pair, as the original).
 *
 * Scenarios:
 *
 * 1. Through the hold, at the settle, midway and at the end, the resting region
 *    lies on the partner's within 15 mm, as the partner breathes.
 * 2. Both bodies stay on the floor: no bone more than 10 mm under it.
 * 3. The resting region bears on the partner in a window.
 * 4. The lying together keeps the shipped bounds over its own span, the partner
 *    bound between the two bodies included.
 *
 * Decomposes the original's checks 1 to 3 for this way, read as the original
 * reads them; the head on the chest is
 * `test_motion_sleep_lie_together_chest`'s, the lying down alone
 * `test_motion_sleep_lie_together_lie_down`'s and the far refusal
 * `test_motion_sleep_lie_together_refusal`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and way it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the displayed regions of both bodies through the hold, both bodies' bones against the floor, the plan's windows and the verdict report over the lying together's span; a contact that drifts as the partner breathes, a body through the floor or the other, a missing window or a finding in the action fails.
 * @evidence contracts/development/testing.md#independent-expectations The skin-contact bound and the floor, as the original; the rest the verdicts' shipped limits.
 * @evidence contracts/development/testing.md#distinguishing-cases One way of the two; the head on the chest is `test_motion_sleep_lie_together_chest`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain, entered through `test_motion_sleep_lie_together_spoon`.
 */
export function test_motion_sleep_lie_together_spoon(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  try {
    lieTogetherScene.verify(
      checks,
      motionHumanBody("m-average"),
      motionHumanBody("f-small"),
      lieTogetherScene.SPOON,
    );
  } catch (error: unknown) {
    checks.check(
      `spoon: ${error instanceof Error ? error.message : String(error)}`,
      false,
    );
  }
  checks.assert("lying together (spoon) meets its acceptance");
}
