import { createFingerRing } from "@automovie/archetypes";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanObject, HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionGraspUnit } from "../../internal/motionGraspUnit";
import { slipRingScene } from "../../internal/slipRingScene";

/**
 * A standing dresser takes the ring up from its stand, on its own: the pickUp
 * step of `test_motion_get_dressed_slip_ring`, the average man's right hand and
 * the small woman's left as the original's two exchanges take it, entered
 * standing with no partner (the pickUp's entry).
 *
 * Scenarios:
 *
 * 1. The hand closes on the ring's hold: its nearest part, the palm or a digit's
 *    tip or pad, lies within half the grasped width of the handle point plus
 *    the touch contract's 10 mm (`IAutoMovieMotionHumanPickUp`).
 * 2. The wrist rises the asked 50 mm within 10 mm.
 * 3. The ring rides the hand from the closure within 5 mm.
 * 4. The pickUp keeps the shipped bounds over its own span.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original and step it decomposes, the entry, the bodies, the hands and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the pickUp alone and reads the displayed hand's contact surfaces, the ring's displayed handle and frame and the verdict report over the pickUp's span; a hand short of the ring, a wrist that does not rise, a ring sliding in the hand or a finding in the pickUp fails.
 * @evidence contracts/development/testing.md#independent-expectations The grip place is the pickUp and grasp contracts': the grip brought onto the handle point and the fingers closed on its colliders until contact, so some part of the hand lies within half the grasped width (the handle's aperture, or its nearest collider's span along the approach) of the point, plus the touch contract's 10 mm; the lift is the authored 50 mm, the custody bound the everyday prop specs' 5 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Two dressers of opposite stature with opposite hands; the slip is `test_motion_get_dressed_slip_ring_slip`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_get_dressed_slip_ring_pick_up`.
 */
export function test_motion_get_dressed_slip_ring_pick_up(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of slipRingScene.CASES) {
    const label: string = `${c.dresser} takes the ring in the ${c.side} hand`;
    try {
      const a: IAutoMovieMotionHumanBody = motionHumanBody(c.dresser);
      const ring: slipRingScene.Ring = createFingerRing({ id: "ring" });
      const take: HumanPerformance = new HumanPerformance({
        seed: "slip-ring",
        performers: [
          {
            subject: "a",
            body: a,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [HumanObject.prop("ring", ring, slipRingScene.stand(c.side))],
        composition: HumanChain.subject("a").pickUp({
          prop: "ring",
          handle: "hold",
          hand: c.side,
          lift: 0.05,
        }).node,
      });
      motionGraspUnit.pickUp(checks, label, take, a, {
        subject: "a",
        side: c.side,
        prop: "ring",
        model: ring,
        handle: "hold",
        lift: 0.05,
      });
    } catch (error: unknown) {
      checks.check(
        `${label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  }
  checks.assert("the ring is taken up from its stand");
}
