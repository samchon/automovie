import { motionPickUpSeated } from "../internal/motionPickUpSeated";

/**
 * A seated person leaning from the seat to pick up a glass past the seated
 * arm, on the average man, read by the whole shipped verdicts over the pick up:
 * no tangle, no foot sliding, lifting or sinking, no joint past its range.
 * `motionPickUpSeated` states the stage and this scenario (6).
 *
 * It runs about 20 s beside another spec: the verdicts' tangle audit reads
 * sub-frame points, each a pose of the seated pick up, whose lean reads the
 * thighs' rest from the legs alone.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Seats a polygon man, picks a real glass up through the public chain and reads the shipped verdicts over the pick up; any tangle, foot fault, range overshoot or jump fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the shipped verdicts' own, the campaign's; nothing is read from the lean.
 * @evidence contracts/development/testing.md#distinguishing-cases The leaning pick up the other seated specs read for its reach, its lean and its seat, here for every bound; the other stature is `test_human_motion_pick_up_seated_tangle_f_small`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the body, where the stage and scenario are stated and the spec's time.
 */
export function test_human_motion_pick_up_seated_tangle_m_average(): void {
  motionPickUpSeated("m-average", "verdicts");
}
