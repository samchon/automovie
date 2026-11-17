import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPerformance, IAutoMovieMotionHumanRest, AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";
import { physicalShapeSegmentDistance } from "@automovie/engine";

import { HumanChain, HumanColliders, HumanHand, HumanPerformance, rest } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Two hands clasped one on the other hold each other's hand, not a forearm,
 * and keep their goals: the parade rest's clasp behind the back with the
 * fingers of both hands extended (TC 3-21.5), and the clasp in front with
 * relaxed hands.
 *
 * The website's parade scene refused its salute because the parade rest it
 * started from laid both hands relaxed: the left fingers, longer than the
 * right hand's reach from its middle to its wrist, curled past the right
 * wrist and sank into the right forearm (8.0 mm on the site's m1).
 *
 * Scenarios, on the four extreme bodies (`motionHumanBody.EXTREMES`), each
 * holding the clasp for 1.5 s and read 0.05 s before its end:
 * 1. Behind: both hands' goals are flat, each hand's surface lies within
 *    15 mm of its goal (the bound of the motions package's own rest case),
 *    and each index tip lies outside every collider of the other forearm.
 * 2. In front: both hands' goals are relaxed and each hand's surface lies
 *    within 15 mm of its goal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs each clasp through the public chain and reads the posed hands against the rest law's own goals and the body's own forearm colliders; a hand off its goal or a fingertip inside the other forearm fails with the body, the clasp and the reading.
 * @evidence contracts/development/testing.md#independent-expectations The hand shapes are the drill manual's for parade rest and the relaxed hands of a clasp in front; the 15 mm bound is the rest case's own; outside a collider is a signed distance of at least zero.
 * @evidence contracts/development/testing.md#distinguishing-cases Both clasps on the four extreme bodies, the shortest and lightest to the tallest and heaviest.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men and performs eight short films; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the defect it guards with its cause, and the 2 scenarios.
 */
export function test_human_motion_rest_clasp(): void {
  const complaints: string[] = [];
  for (const name of motionHumanBody.EXTREMES) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const [place, shape] of [
      ["claspedBehind", "flat"],
      ["claspedFront", "relaxed"],
    ] as const) {
      const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "clasp",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").rest({
          left: place,
          right: place,
          seconds: 1.5,
        }).node,
      });
      const t: number = performance.duration - 0.05;
      const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> = performance.bones(
        "a",
        t,
      );
      const goals: Partial<Record<IAutoMovieMotionHumanHand.Side, IAutoMovieMotionHumanRest.IGoal>> = rest.goals(
        body,
        performance.posture("a", t),
        { left: place, right: place },
      );
      for (const side of ["left", "right"] as const) {
        const goal: IAutoMovieMotionHumanRest.IGoal = goals[side]!;
        if (goal.shape !== shape)
          complaints.push(
            `${name} ${place} ${side}: the hand is ${goal.shape}, not ${shape}`,
          );
        const got: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          goal.surface,
          goal.shape,
        ).point;
        const miss: number = Math.hypot(
          got.x - goal.point.x,
          got.y - goal.point.y,
          got.z - goal.point.z,
        );
        if (miss > 0.015)
          complaints.push(
            `${name} ${place} ${side}: the ${goal.surface} lies ${(miss * 1000).toFixed(1)} mm off its goal`,
          );
        if (place !== "claspedBehind") continue;

        // The index tip against every shape of the other forearm.
        const tip: IAutoMovieVector3 = HumanHand.frame(
          body,
          bones,
          side,
          "indexTip",
          goal.shape,
        ).point;
        const other: AutoMovieHumanoidBone =
          side === "left" ? "rightLowerArm" : "leftLowerArm";
        for (const segment of HumanColliders.placed(body, bones))
          if (segment.bone === other)
            for (const solid of segment.shapes) {
              const d: number = physicalShapeSegmentDistance(
                segment.pose,
                solid,
                tip,
                tip,
              );
              if (d < 0)
                complaints.push(
                  `${name} ${place}: the ${side} index tip lies ${(-d * 1000).toFixed(1)} mm inside ${other}`,
                );
            }
      }
    }
  }
  TestValidator.equals(
    "clasped hands hold each other's hand and keep their goals",
    complaints,
    [],
  );
}
