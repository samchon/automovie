import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { PlaygroundBodies } from "../../src/playground/package/PlaygroundBodies";

/**
 * The standalone karate form admits both of the gallery's lead performers.
 *
 * Scenarios:
 * 1. The m1 and f2 figures each plan and display the same four-stroke phrase.
 * 2. On each figure the right wrist leads at the first extension and the
 *    left wrist leads at the second, while the other hand is in chamber.
 */
export function test_website_martial_punches(): void {
  for (const id of ["m1", "f2"] as const) {
    const body: IAutoMovieMotionHumanBody = PlaygroundBodies.get(id).body;
    const performance: HumanPerformance = new HumanPerformance({
      seed: "martial-chamber-clearance",
      performers: [
        {
          subject: "student",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("student").act("martialArt", {
        kind: "chokuZuki",
      }).node,
    });
    TestValidator.predicate(
      `${id} preserves the four-stroke phrase duration`,
      Math.abs(performance.duration - 3) < 1e-8,
    );

    const span: number = body.measure.upperArm + body.measure.forearm;
    for (const [seconds, leading, chambered] of [
      [0.8, "rightHand", "leftHand"],
      [1.2, "leftHand", "rightHand"],
    ] as const) {
      const bones: ReturnType<HumanPerformance["bones"]> = performance.bones(
        "student",
        seconds,
      );
      TestValidator.predicate(
        `${id} extends ${leading} ahead of the chambered hand at ${seconds} s`,
        bones.get(leading)!.worldPosition.z -
          bones.get(chambered)!.worldPosition.z >
          span / 3,
      );
    }
  }
}
