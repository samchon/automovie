import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionGraspUnit } from "../../internal/motionGraspUnit";
import { wardrobeFootwearScene } from "../../internal/wardrobeFootwearScene";

/**
 * Footwear taken up from its table top by a standing performer, on its own: the
 * first step of `test_motion_dress_wardrobe_footwear`, the shoe in the average
 * man's left hand and the sock in the small woman's right (the hand opposite
 * the raised foot), entered standing (the pickUp is the chain's first action).
 *
 * Scenarios:
 *
 * 1. The hand closes on the footwear's hold: its nearest part, the palm or a
 *    digit's tip or pad, lies within half the grasped width of the handle point
 *    plus the touch contract's 10 mm (`IAutoMovieMotionHumanPickUp`).
 * 2. The wrist rises the asked 40 mm within 10 mm.
 * 3. The footwear rides the hand from the closure within 5 mm.
 * 4. The pickUp keeps the shipped bounds over its own span.
 *
 * The original reads no goal of this step.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the cases and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the pickUp alone and reads the displayed hand's contact surfaces, the footwear's displayed handle and frame and the verdict report over the pickUp's span; a hand short of the handle, a wrist that does not rise, footwear sliding in the hand or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The grip place is the pickUp and grasp contracts': the grip brought onto the handle point and the fingers closed on its colliders until contact, so some part of the hand lies within half the grasped width of the point, plus the touch contract's 10 mm; the lift is the authored 40 mm, the custody bound the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two casts with opposite hands and the two footwear kinds; the exchange on the foot is the on and off units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_dress_wardrobe_footwear_pick_up`.
 */
export function test_motion_dress_wardrobe_footwear_pick_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of wardrobeFootwearScene.CASES)
    try {
      const s: wardrobeFootwearScene.IScene = wardrobeFootwearScene.scene(c);
      const take: HumanPerformance = wardrobeFootwearScene.perform(
        s,
        wardrobeFootwearScene.pickUp(s),
      );
      motionGraspUnit.pickUp(checks, c.label, take, s.body, {
        subject: "actor",
        side: s.hand,
        prop: "footwear",
        model: s.model,
        handle: "hold",
        lift: 0.04,
      });
    } catch (error: unknown) {
      checks.check(
        `${c.label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("footwear is taken up from its table top");
}
