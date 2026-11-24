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
 * A seated diner takes the rice bowl up in the other hand, on its own: step 5
 * (pickUp of the bowl) of `test_motion_dining_utensils_chopsticks`, the bowl in
 * the left hand on m-average and the right on f-small, entered by the minimal
 * chain sit > pickUp(bowl), without the chopsticks' steps before it (the
 * grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The other hand closes on the bowl's body: its nearest part, the palm or a
 *    digit's tip or pad, lies within half the grasped width of the handle point
 *    plus the touch contract's 10 mm (`IAutoMovieMotionHumanPickUp`).
 * 2. The wrist rises the asked 50 mm within 10 mm.
 * 3. The bowl rides the hand from the closure within 5 mm.
 * 4. The pickUp keeps the shipped bounds over its own span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp and reads the displayed hand's contact surfaces, the bowl's displayed handle and frame and the verdict report over the pickUp's span; a grip short of the bowl, a wrist that does not rise, a bowl sliding in the hand or a finding in the pickUp fails, and the chopsticks' steps cannot hide it.
 * @evidence contracts/development/testing.md#independent-expectations The grip place is the pickUp and grasp contracts': the grip brought onto the handle point and the fingers closed on its colliders until contact, so some part of the hand lies within half the grasped width (the handle's aperture, or its nearest collider's span along the approach) of the point, plus the touch contract's 10 mm, the lift the authored 50 mm, the custody bound the everyday prop specs' 5 mm and the rest the verdicts' shipped limits.
 * @evidence contracts/development/testing.md#distinguishing-cases Left- against right-hand bowls on two statures; the raise to the chin is `test_motion_dining_chopsticks_raise_bowl`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_chopsticks_pick_up_bowl`.
 */
export function test_motion_dining_chopsticks_pick_up_bowl(): void {
  diningTable.run("chopsticks: pick up the bowl", pickUpBowl);
}

/** One diner's pickUp of the bowl and its checks. */
function pickUpBowl(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const scene: diningScene.IChopsticks = diningScene.chopsticks(body, side);
  const take: HumanPerformance = diningScene.perform(
    `${label.split(" ")[0]} chopsticks chopsticks`,
    body,
    scene.props,
    HumanChain.subject("actor")
      .sit({ seat: scene.stage.seat, hold: 1 })
      .pickUp({ prop: "bowl", handle: "body", hand: scene.other, lift: 0.05 }),
  );
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side: scene.other,
    prop: "bowl",
    model: scene.models.bowl!,
    handle: "body",
    lift: 0.05,
  });
}
