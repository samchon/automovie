import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  createHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { MotionBodies } from "../../../../packages/motions/src/executable/MotionBodies";

/**
 * A planted foot holds through an inertialized transition: the decaying
 * offset of the action left behind, and the range-of-motion clamp, never move
 * a plant, because the plant is re-solved last.
 *
 * A polygon man stands for 1 s, then rests his hands on his hips for 1 s, a
 * law that keeps both feet planted where they are while the arms and trunk
 * change, so the transition between them is inertialized over its blend.
 *
 * Scenarios, on the smallest and the tallest sweep bodies:
 * 1. Through the 0.25 s blend after the change, sampled at 240 Hz, each ankle
 *    stays within 1 mm of where it was at the change.
 * 2. The arms do move in that window (a hand travels more than 5 cm), so the
 *    transition is really there.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the real performance across a real transition and reads the displayed ankles; a plant moved by the offset or the clamp fails.
 * @evidence contracts/development/testing.md#independent-expectations The bound is the plant itself: the ankle at the change.
 * @evidence contracts/development/testing.md#distinguishing-cases Two statures, and a control that the arms move.
 * @evidence contracts/development/testing.md#execution-ownership A local test: it prepares Human bodies, so its name falls under the CI exclusion of test_human_.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 scenarios and what each pins.
 */
export function test_human_motion_plant_transition(): void {
  for (const name of ["f-small", "m-tall"] as const) {
    const man = MotionBodies.population(name);
    const body = createHumanBody(man.body.skeleton, man.body.profile);
    const performance: HumanPerformance = new HumanPerformance({
      seed: "plant",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 1 })
        .rest({ left: "hip", right: "hip", seconds: 1 }).node,
    });
    const change: number = performance.segments("a")[1]!.entryTime;
    const at = (t: number, bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      performance.bones("a", t).get(bone)!.worldPosition;
    const anchor = {
      left: at(change, "leftFoot"),
      right: at(change, "rightFoot"),
    };
    const hand: IAutoMovieVector3 = at(change, "leftHand");
    let drift: number = 0;
    let travel: number = 0;
    for (let k: number = 0; k <= 60; k++) {
      const t: number = change + k / 240;
      for (const side of ["left", "right"] as const) {
        const p: IAutoMovieVector3 = at(t, `${side}Foot`);
        drift = Math.max(
          drift,
          Math.hypot(
            p.x - anchor[side].x,
            p.y - anchor[side].y,
            p.z - anchor[side].z,
          ),
        );
      }
      const h: IAutoMovieVector3 = at(t, "leftHand");
      travel = Math.max(
        travel,
        Math.hypot(h.x - hand.x, h.y - hand.y, h.z - hand.z),
      );
    }
    TestValidator.predicate(
      `${name}: the plants hold within 1 mm through the blend (${(drift * 1000).toFixed(3)} mm)`,
      drift <= 0.001,
    );
    TestValidator.predicate(
      `${name}: the hand moves in the blend (${(travel * 100).toFixed(1)} cm)`,
      travel > 0.05,
    );
  }
}
