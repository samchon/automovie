import { Quaternion } from "@automovie/engine";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { caneSweepScene } from "../../internal/caneSweepScene";
import { motionGraspUnit } from "../../internal/motionGraspUnit";

/**
 * How far the wrist rises after the grasp when no lift is asked, metres:
 * `IAutoMovieMotionHumanPickUp.lift`'s stated default.
 */
const LIFT: number = 0.1;

/**
 * A standing walker takes up the long cane where it stands beside the right
 * foot, on its own: step 1 (pickUp) of `test_motion_gait_cane_sweep`, on the
 * average man and the small woman, each with the cane fitted to the sternum,
 * entered standing (the pickUp is the chain's first action).
 *
 * Scenarios:
 *
 * 1. The right hand closes on the cane's grip: its nearest part, the palm or a
 *    digit's tip or pad, lies within half the grasped width of the handle point
 *    plus the touch contract's 10 mm (`IAutoMovieMotionHumanPickUp`).
 * 2. The wrist rises the default 0.1 m within 10 mm, no lift being asked.
 * 3. The cane rides the hand from the closure within 5 mm.
 * 4. The pickUp keeps the shipped bounds over its own span.
 *
 * The original reads no goal of this step; CI 45292314321 found its jump and
 * turn on the right middle finger inside the original's whole-take verdict.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the pickUp alone and reads the displayed hand's contact surfaces, the cane's displayed handle and frame and the verdict report over the pickUp's span; a hand short of the handle, a wrist that does not rise, a cane sliding in the hand or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The grip place is the pickUp and grasp contracts': the grip brought onto the handle point and the fingers closed on its colliders until contact, so some part of the hand lies within half the grasped width (the handle's aperture, or its nearest collider's span along the approach) of the point, plus the touch contract's 10 mm, the lift the pickUp's documented default, the custody bound the everyday prop specs' 5 mm, the cane's length the sternum fitting.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature with canes of their own length; the sweep is its own units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_cane_sweep_pick_up`.
 */
export function test_motion_gait_cane_sweep_pick_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const)
    try {
      const body: IAutoMovieMotionHumanBody = motionHumanBody(fit);
      const cane: caneSweepScene.Cane = caneSweepScene.fitted(body);
      const take: HumanPerformance = new HumanPerformance({
        seed: "cane sweep",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          HumanObject.prop("cane", cane, {
            position: caneSweepScene.STAND,
            rotation: Quaternion.identity(),
          }),
        ],
        composition: HumanChain.subject("a").pickUp({
          prop: "cane",
          handle: "grip",
          hand: "right",
        }).node,
      });
      motionGraspUnit.pickUp(checks, fit, take, body, {
        subject: "a",
        side: "right",
        prop: "cane",
        model: cane,
        handle: "grip",
        lift: LIFT,
      });
    } catch (error: unknown) {
      checks.check(
        `${fit}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("the long cane is taken up where it stands");
}
