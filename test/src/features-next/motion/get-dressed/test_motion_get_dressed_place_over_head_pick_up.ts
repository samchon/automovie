import { createNecklace } from "@automovie/archetypes";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionGraspUnit } from "../../internal/motionGraspUnit";
import { placeOverHeadScene } from "../../internal/placeOverHeadScene";

/**
 * A standing dresser takes the neck loop up from its stand, on its own: the
 * pickUp step of `test_motion_get_dressed_place_over_head`, the average man and
 * the small woman, the loop laid as each placing lays it (turned for one worn
 * from in front and by its left handle, or as worn from behind and by its
 * right), entered standing with no partner (the pickUp's entry).
 *
 * Scenarios:
 *
 * 1. The right hand closes on the loop's handle: its nearest part, the palm or a
 *    digit's tip or pad, lies within half the grasped width of the handle point
 *    plus the touch contract's 10 mm (`IAutoMovieMotionHumanPickUp`).
 * 2. The wrist rises the asked 50 mm within 10 mm.
 * 3. The loop rides the hand from the closure within 5 mm.
 * 4. The pickUp keeps the shipped bounds over its own span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the bodies, the two layings and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the pickUp alone and reads the displayed hand's contact surfaces, the loop's displayed handle and frame and the verdict report over the pickUp's span; a hand short of the handle, a wrist that does not rise, a loop sliding in the hand or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The grip place is the pickUp and grasp contracts': the grip brought onto the handle point and the fingers closed on its colliders until contact, so some part of the hand lies within half the grasped width (the handle's aperture, or its nearest collider's span along the approach) of the point, plus the touch contract's 10 mm, the lift the authored 50 mm, the custody bound the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two dressers of opposite stature and the two layings and handles; the placings are their own units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_get_dressed_place_over_head_pick_up`.
 */
export function test_motion_get_dressed_place_over_head_pick_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const dresser of ["m-average", "f-small"] as const)
    for (const pose of ["front", "behind"] as const) {
      const label: string = `${dresser} takes up a loop laid for ${pose}`;
      try {
        const a: IAutoMovieMotionHumanBody = motionHumanBody(dresser);
        const loop: placeOverHeadScene.Loop = createNecklace({
          id: "loop",
          kind: pose === "front" ? "ribbon" : "chain",
        });
        const take: HumanPerformance = new HumanPerformance({
          seed: "place-over-head",
          performers: [
            {
              subject: "a",
              body: a,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          props: [
            HumanObject.prop("loop", loop, placeOverHeadScene.stand(pose)),
          ],
          composition: HumanChain.subject("a").pickUp({
            prop: "loop",
            handle: placeOverHeadScene.handle(pose),
            hand: "right",
            lift: 0.05,
          }).node,
        });
        motionGraspUnit.pickUp(checks, label, take, a, {
          subject: "a",
          side: "right",
          prop: "loop",
          model: loop,
          handle: placeOverHeadScene.handle(pose),
          lift: 0.05,
        });
      } catch (error: unknown) {
        checks.check(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
      }
    }
  checks.assert("the neck loop is taken up from its stand");
}
