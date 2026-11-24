import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { crutchStairsScene } from "../../internal/crutchStairsScene";

/**
 * Climbing down two steps on two crutches, "down with the bad", on its own: the
 * `down` cells of `test_motion_gait_crutch_stairs`, on the average man and the
 * small woman, entered standing on the top landing in the tripod (the climb is
 * one action).
 *
 * Scenarios:
 *
 * 1. Each step moves both crutches onto the next tread down while the sound foot
 *    stays planted (2 mm), then sets the sound foot there while both tips stay
 *    planted.
 * 2. At each crutch arrival both tips stand on their tread, at its height within
 *    10 mm and within its going; at each foot arrival the sound sole stands on
 *    its tread within 10 mm.
 * 3. The hands bear on the handgrips at every arrival, within 10 mm and half a
 *    hand.
 * 4. The injured foot stays above the sound foot's tread from the first crutch
 *    move on.
 * 5. The climb keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks 1 to 4 for the climb down, read as the
 * original reads them; the climb up is `test_motion_gait_crutch_stairs_up`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and cells it decomposes, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's events, the crutches' displayed frames, the displayed soles and hands and the verdict report over the climb's span; a foot moving with the crutches, a crutch moving with the foot, a tip or sole off its tread, a hand off its grip, a bearing injured foot or a finding in the climb fails, and each body's cell reports on its own.
 * @evidence contracts/development/testing.md#independent-expectations The order is HealthLinkBC's "up with the good, down with the bad"; the tread places follow from the authored flight (UK Approved Document K's limits); the planted and support bounds are the campaign's, the grip bound the touch contract's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the opposite order is the climb up's unit.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_crutch_stairs_down`.
 */
export function test_motion_gait_crutch_stairs_down(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const)
    try {
      crutchStairsScene.verify(
        checks,
        motionHumanBody(fit),
        `${fit} down`,
        "down",
      );
    } catch (error: unknown) {
      checks.check(
        `${fit} down: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("the crutch climb down meets its acceptance");
}
