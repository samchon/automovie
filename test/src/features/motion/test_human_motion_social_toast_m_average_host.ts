import { motionSocialToast } from "../internal/motionSocialToast";

/**
 * Two people of different height clink glasses, each an archetype held by
 * the hand that picked it up (#3350, #3358): the m-average body hosts and the
 * f-small body is the guest. `motionSocialToast` states the placement and
 * the 5 scenarios with their bounds; the other cast is its own spec, so each
 * runs alone in its time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places real archetypes, joins the cast through the public mutual join and reads displayed prop frames and hands; glasses that pass each other, a tipped glass or fists meeting with the glasses left behind fail.
 * @evidence contracts/development/testing.md#independent-expectations Every bound is an acceptance line of #3350 or #3361; a rim is the archetype's own lip affordance.
 * @evidence contracts/development/testing.md#distinguishing-cases The m-average body as host; the other cast, the taller person in the other role, is `test_human_motion_social_toast_f_small_host`; the handover is `test_human_motion_social_handover`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and one archetype and builds one two-person performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the cast, where the scenarios are stated and the split.
 */
export function test_human_motion_social_toast_m_average_host(): void {
  motionSocialToast.check("m-average", "f-small");
}
