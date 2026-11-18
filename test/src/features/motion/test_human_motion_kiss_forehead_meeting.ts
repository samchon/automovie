import { motionKissMeeting } from "../internal/motionKissMeeting";

/**
 * The lips meet the forehead of the standing large partner on the original small-kisser stage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the performers, target and measured separation and penetration limits.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public contact and audits penetration across both bodies.
 * @evidence contracts/development/testing.md#independent-expectations The displayed transformations place each skin surface at contact, mid-hold and parting. Limits are 5 mm separation and 10 mm penetration.
 * @evidence contracts/development/testing.md#distinguishing-cases The articulated hand and stationary forehead each own their extreme-pair stage.
 * @evidence contracts/development/testing.md#execution-ownership Performs one in-memory scene.
 */
export function test_human_motion_kiss_forehead_meeting(): void {
  motionKissMeeting("forehead");
}
