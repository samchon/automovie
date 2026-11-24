import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { diningTable } from "../../../features/internal/diningTable";
import type { motionComplaints } from "../../../features/internal/motionComplaints";
import { diningScene } from "../../internal/diningScene";
import { motionGraspUnit } from "../../internal/motionGraspUnit";

/**
 * A seated diner takes the knife up in the dominant hand, on its own: step 3
 * (pickUp of the knife) of `test_motion_dining_utensils_cut`, right-handed on
 * m-average and left-handed on f-small, entered by the minimal chain sit >
 * pickUp, without the fork in the other hand (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The hand closes on the knife's grip: its nearest part, the palm or a digit's
 *    tip or pad, lies within half the grasped width of the handle point plus
 *    the touch contract's 10 mm (`IAutoMovieMotionHumanPickUp`).
 * 2. The wrist rises the asked 50 mm within 10 mm.
 * 3. The knife rides the hand from the closure within 5 mm.
 * 4. The pickUp keeps the shipped bounds over its own span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp and reads the displayed hand's contact surfaces, the knife's displayed handle and frame and the verdict report over the pickUp's span; a hand short of the handle, a wrist that does not rise, a knife sliding in the hand or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The grip place is the pickUp and grasp contracts': the grip brought onto the handle point and the fingers closed on its colliders until contact, so some part of the hand lies within half the grasped width (the handle's aperture, or its nearest collider's span along the approach) of the point, plus the touch contract's 10 mm, the lift the authored 50 mm, the custody bound the everyday prop specs' 5 mm and the rest the verdicts' shipped limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the knife taken with the fork already held is the saw's entry, `test_motion_dining_cut_write_saw`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_cut_pick_up_knife`.
 */
export function test_motion_dining_cut_pick_up_knife(): void {
  diningTable.run("knife and fork: pick up the knife", pickUpKnife);
}

/** One diner's pickUp of the knife and its checks. */
function pickUpKnife(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.ICut = diningScene.cut(side);
  const take: HumanPerformance = diningScene.perform(
    `${label.split(" ")[0]} knife and fork cut`,
    body,
    scene.props,
    HumanChain.subject("actor")
      .sit({ seat: scene.stage.seat, hold: 1 })
      .pickUp({ prop: "knife", handle: "grip", hand: side, lift: 0.05 }),
  );
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side,
    prop: "knife",
    model: scene.models.knife!,
    handle: "grip",
    lift: 0.05,
  });
}
