import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { crutchStairsScene } from "../../internal/crutchStairsScene";

/**
 * Climbing up two steps on two crutches, "up with the good", on its own: the
 * `up` cells of `test_motion_gait_crutch_stairs`, on the average man and the
 * small woman, entered standing on the floor before the flight in the tripod
 * (the climb is one action).
 *
 * Scenarios:
 *
 * 1. Each step sets the sound foot on the next tread while both crutch tips stay
 *    planted (2 mm), then moves both crutches onto that tread while the sound
 *    foot stays planted.
 * 2. At each crutch arrival both tips stand on their tread, at its height within
 *    10 mm and within its going; at each foot arrival the sound sole stands on
 *    its tread within 10 mm.
 * 3. The hands bear on the handgrips at every arrival, within 10 mm and half a
 *    hand.
 * 4. The injured foot stays above the sound foot's tread from its lift on.
 * 5. The climb keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks 1 to 4 for the climb up, read as the
 * original reads them; the descent is `test_motion_gait_crutch_stairs_down`'s
 * and the riser's refusal `test_motion_gait_crutch_stairs_refusal`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and cells it decomposes, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's events, the crutches' displayed frames, the displayed soles and hands and the verdict report over the climb's span; a crutch moving with the foot, a foot moving with the crutches, a tip or sole off its tread, a hand off its grip, a bearing injured foot or a finding in the climb fails, and each body's cell reports on its own.
 * @evidence contracts/development/testing.md#independent-expectations The order is HealthLinkBC's "up with the good, down with the bad"; the tread places follow from the authored flight (UK Approved Document K's limits); the planted and support bounds are the campaign's, the grip bound the touch contract's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the opposite order is the descent's unit.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_crutch_stairs_up`.
 */
export function test_motion_gait_crutch_stairs_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const)
    try {
      crutchStairsScene.verify(checks, motionHumanBody(fit), `${fit} up`, "up");
    } catch (error: unknown) {
      checks.check(
        `${fit} up: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("the crutch climb up meets its acceptance");
}
