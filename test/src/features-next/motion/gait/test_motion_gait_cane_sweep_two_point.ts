import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { caneSweepScene } from "../../internal/caneSweepScene";

/**
 * The two-point touch of a long cane swept along a corridor walk, on its own:
 * the sweep step of `test_motion_gait_cane_sweep` in its `twoPoint` cells, on
 * the average man and the small woman, entered by the minimal chain
 * pickUp(cane) > walk with the caneSweep overlay (the grammar has no entry
 * state; the walk is the overlay's carrier).
 *
 * Scenarios:
 *
 * 1. The sweep touches at every step: at least two touches.
 * 2. At every touch the tip is on the floor (2 mm) on the side opposite the
 *    landing foot, between the shoulder's half width and an inch beyond the
 *    body's widest part.
 * 3. Between touches the tip rises off the floor no more than an inch.
 * 4. The cane hand stays at the body's midline within 20 mm.
 * 5. The sweep keeps the shipped bounds of the cane arm over its overlay's span of
 *    the walk.
 *
 * Decomposes the original's checks 1 to 4 for the two-point technique, read as
 * the original reads them; the constant technique is
 * `test_motion_gait_cane_sweep_constant`'s, the pickUp
 * `test_motion_gait_cane_sweep_pick_up`'s and the short cane
 * `test_motion_gait_cane_sweep_refusal`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the overlay's touch events, the cane's displayed tip, the displayed feet, hips and grip socket and the verdict report over the overlay's span; a touch in the air or on the stepping foot's side, an arc too narrow or wide, a tip dragging or flying, a hand off the midline or a cane-arm finding fails, and each body's cell reports on its own.
 * @evidence contracts/development/testing.md#independent-expectations The touch rule, the arc's width and the lift are the Hoover technique's (APH; Kim, Wall Emerson and Naghshineh 2017), the cane's length the sternum fitting, the floor bound the campaign's, as the original states them.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature; the technique that must not lift is the constant unit's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_cane_sweep_two_point`.
 */
export function test_motion_gait_cane_sweep_two_point(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const)
    try {
      caneSweepScene.verify(
        checks,
        motionHumanBody(fit),
        `${fit} twoPoint`,
        "twoPoint",
      );
    } catch (error: unknown) {
      checks.check(
        `${fit} twoPoint: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("the two-point cane sweep meets its acceptance");
}
