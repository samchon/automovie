import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { crutchWalkScene } from "../../internal/crutchWalkScene";

/**
 * The three-point gait on two crutches over three straight stations, on its
 * own: the `threePoint` cells of `test_motion_gait_crutch_walk`, on the average
 * man and the small woman, entered standing in the tripod (the walk is one
 * action).
 *
 * Scenarios:
 *
 * 1. Both crutch tips plant before each swing and stay planted through it, within
 *    2 mm.
 * 2. The hands bear on the handgrips through each swing, within 10 mm and half a
 *    hand, and the underarm pads stay 30 mm below the axillae.
 * 3. Entered standing on both feet, the injured foot never bears from the first
 *    crutch plant on.
 * 4. The walk keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks 1 to 3 for this gait, gathered: the original
 * stops at its first failure, so its first cell's verdict hid every other
 * check. Here each check reports on its own; the swing gaits are
 * `test_motion_gait_crutch_walk_swing_to`'s and
 * `test_motion_gait_crutch_walk_swing_through`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and cells it decomposes, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the crutches' displayed frames, the hands at the handgrips, the soles and the shoulders through each station and the verdict report over the walk's span; a crutch moving in a swing, a hand off its grip, a pad in the axilla, the gait's foot rule broken or a finding in the walk fails, and each body's cell reports on its own.
 * @evidence contracts/development/testing.md#independent-expectations The gait orders and the tripod are Physiopedia's crutch gaits; the grip bound is the touch contract's; the planted bound and the pad's two finger widths are the original's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the swing gaits are `test_motion_gait_crutch_walk_swing_to`'s and `test_motion_gait_crutch_walk_swing_through`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_crutch_walk_three_point`.
 */
export function test_motion_gait_crutch_walk_three_point(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const)
    try {
      crutchWalkScene.verify(
        checks,
        motionHumanBody(fit),
        `${fit} threePoint`,
        "threePoint",
      );
    } catch (error: unknown) {
      checks.check(
        `${fit} threePoint: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("the threePoint crutch walk meets its acceptance");
}
