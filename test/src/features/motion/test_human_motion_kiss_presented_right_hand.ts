import { motionKissMeeting } from "../internal/motionKissMeeting";

/**
 * The kisser follows the presentation of the right hand and meets its displayed back.
 *
 * Scenarios:
 * 1. The tall presenter holds out the right hand at the short kisser's neck height. The kisser starts after its presentation and keeps lip contact through parting.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two roles, the presented hand and the interval measured.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the synchronized presentation and kiss through the public composition. Checks the event order and samples the right hand back throughout lip contact, catching a kiss that targets the wrong side or misses a posed hand.
 * @evidence contracts/development/testing.md#independent-expectations The displayed bones locate the lip and hand-back skin frames. The existing limits are 5 mm separation at the three sampled contact instants and 10 mm penetration across the film.
 * @evidence contracts/development/testing.md#distinguishing-cases Owns the right hand presented by a preceding held touch. The mutual kiss spec owns shared events on the left hand, the forehead spec owns the stationary target, and the reach spec owns the refusal.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory test delegates staging and measurement to the shared kiss witness.
 */
export function test_human_motion_kiss_presented_right_hand(): void {
  motionKissMeeting("handBackRight");
}
