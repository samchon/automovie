import { kissHandMeeting } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `kissHandMeeting.kind` names the meeting of a hand kiss on one hand: its kind
 * is keyed by the shared hand, its two roles the kisser and the presenter, its
 * one contact met at the performer's own facing, so the two roles of the left
 * and the right hand meet as two kinds.
 *
 * Scenarios: the left hand's kind is `kissHand-left` with the kisser first and
 * the presenter second and one `contact`; the right hand's is `kissHand-right`,
 * a different kind.
 */
export function test_unit_motions_touch_kiss_hand_meeting_kind(): void {
  const left = kissHandMeeting.kind("left", 1);
  const right = kissHandMeeting.kind("right", 1);
  TestValidator.equals(
    "the kinds",
    [left.name, left.roles, Object.keys(left.contacts), right.name],
    ["kissHand-left", ["kisser", "presenter"], ["contact"], "kissHand-right"],
  );
}
