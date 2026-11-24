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
 * A seated diner takes the chopsticks up from the table, on its own: step 2
 * (pickUp) of `test_motion_dining_utensils_chopsticks`, right-handed on
 * m-average and left-handed on f-small, entered by the minimal chain sit >
 * pickUp (the grammar has no entry state).
 *
 * Scenarios:
 *
 * 1. The dominant hand closes on the sticks' grip: its nearest part, the palm or a
 *    digit's tip or pad, lies within half the grasped width of the handle point
 *    plus the touch contract's 10 mm (`IAutoMovieMotionHumanPickUp`).
 * 2. The wrist rises the asked 50 mm within 10 mm.
 * 3. The sticks ride the hand from the closure within 5 mm.
 * 4. The pickUp keeps the shipped bounds over its own span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry chain, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs sit > pickUp and reads the displayed hand's contact surfaces, the sticks' displayed handle and frame and the verdict report over the pickUp's span; a hand short of the handle, a wrist that does not rise, sticks sliding in the hand or a penetration, slip, range or continuity finding in the pickUp fails, and no other action's fault decides it.
 * @evidence contracts/development/testing.md#independent-expectations The grip place is the pickUp and grasp contracts': the grip brought onto the handle point and the fingers closed on its colliders until contact, so some part of the hand lies within half the grasped width (the handle's aperture, or its nearest collider's span along the approach) of the point, plus the touch contract's 10 mm, the lift the authored 50 mm, the custody bound the everyday prop specs' 5 mm and the rest the verdicts' shipped limits; none is read from the pickUp's plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners of two statures; the stroke, the pinch, the bowl and the bite are their own units', the whole chain the integration copy's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances of one polygon man with the dining props, entered through `test_motion_dining_chopsticks_pick_up_sticks`.
 */
export function test_motion_dining_chopsticks_pick_up_sticks(): void {
  diningTable.run("chopsticks: pick up the sticks", pickUpSticks);
}

/** One diner's pickUp of the sticks and its checks. */
function pickUpSticks(
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
      .pickUp({ prop: "sticks", handle: "grip", hand: side, lift: 0.05 }),
  );
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side,
    prop: "sticks",
    model: scene.models.sticks!,
    handle: "grip",
    lift: 0.05,
  });
}
