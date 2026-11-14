import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanEmblem,
  HumanPerformance,
  HumanPose,
  type HumanSegment,
  HumanSignature,
  type IHumanActionLaw,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An upper-body row is performed kneeling as it is standing: a person who
 * has knelt down to sit on the heels puts a hand on the heart without
 * leaving that base (#3361's composition matrix, the kneeling base).
 *
 * Scenarios, on the small woman and the average man, each after
 * `HumanPose.kneelSit`:
 * 1. `handOnHeart` (a row of `touch`): at the middle of its hold the right
 *    palm lies within 15 mm of the left chest region (#3345).
 * 2. The pelvis stays within 10 mm of where kneeling left it, at the middle
 *    of the hold (the campaign's bound for a supported body, #3358).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the performances through the public chain and reads displayed joints and regions; a row that lifts the body off its heels or misses its region kneeling fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are acceptance lines of #3345 and #3358.
 * @evidence contracts/development/testing.md#distinguishing-cases One row on the kneeling base, two statures; the seated base is `test_human_motion_hand_seated_rows`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short performances; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 2 scenarios with their bounds.
 */
export function test_human_motion_hand_kneeling_rows(): void {
  const laws: IHumanActionLaw<never>[] = [
    HumanEmblem.handOnHeart,
    HumanPose.kneelSit,
  ];
  const complaints: string[] = [];
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  for (const name of ["f-small", "m-average"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    try {
      const performance: HumanPerformance = new HumanPerformance({
        seed: "kneeling",
        laws,
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
          .registered("kneelSit", {})
          .registered("handOnHeart", {}).node,
      });
      const settled: HumanSegment.ISegment = performance.segments("a")[0]!;
      const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
      const instant = (event: string): number =>
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration;
      const held: number = (instant("strokeEnd") + instant("relax")) / 2;
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );

      // 1. The palm on the heart.
      const off: number = gap(
        AutoMovieMotionHumanTouchEffector.point(
          body,
          performance.bones("a", held),
          "right",
          touch.EFFECTORS.palm,
        ),
        HumanSignature.region(reader, "chestLeft", held),
      );
      if (!(off <= 0.015))
        complaints.push(
          `${name}: handOnHeart kneeling: the palm is ${(off * 1000).toFixed(0)} mm from the left chest, within 15 mm expected`,
        );

      // 2. Still on the heels.
      const moved: number = gap(
        HumanSignature.joint(reader, held, "hips"),
        HumanSignature.joint(reader, settled.end, "hips"),
      );
      if (!(moved <= 0.01))
        complaints.push(
          `${name}: handOnHeart kneeling: the pelvis is ${(moved * 1000).toFixed(0)} mm from where kneeling left it, within 10 mm expected`,
        );
    } catch (error) {
      complaints.push(
        `${name}: handOnHeart kneeling: expected to plan, got ${(error as Error).message}`,
      );
    }
  }
  TestValidator.equals("an upper-body row on a kneeling base", complaints, []);
}
