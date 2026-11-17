import type {
  IAutoMovieFormationPoseTake,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanPopulation,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";
import { qclose } from "../internal/qclose";

/**
 * Population extras can hold a foreground template's settled standing pose.
 *
 * Scenarios:
 * 1. Hold a two-second stand performed away from the origin and facing +X.
 *    Its three output phases carry the settled articulation at the slot
 *    origin facing +Z, with a two-second period and zero stride.
 * 2. The end of the stand is outside its placed interval, and a fractional
 *    phase count is refused without reading a pose.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the performed stand, its frame, the held pose invariants and the refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public standing take producer on a scheduled stand. Slot placement, phase count, timing and the articulated pose are observable in the take passed to the population consumer.
 * @evidence contracts/development/testing.md#independent-expectations The period is the authored two seconds, a held stand travels zero metres, and the known upright +X placement becomes the identity rotation facing +Z. The stand law's documented half-second settle gives the reference articulation; the stand law's biomechanics are tested elsewhere.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a placed and rotated template, multiple held phases, the end-exclusive interval and malformed sample count. The existing ensemble population spec covers the moving cycle.
 * @evidence contracts/development/testing.md#execution-ownership A discovered motion feature unit constructs one in-memory HumanPerformance and reads one settled instant and its take. It starts no viewer, host or render.
 */
export function test_human_motion_ensemble_population_stand(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "held-standing-population",
    performers: [
      {
        subject: "template",
        body,
        at: { x: 8, y: 0, z: -3 },
        yaw: 90,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("template").stand({ seconds: 2 }).node,
  });

  // 1. The same held articulation fills each of the population take's phases.
  const take: IAutoMovieFormationPoseTake = HumanPopulation.standing(
    performance,
    "template",
    0,
    3,
  );
  const settled: IAutoMoviePose = performance.pose("template", 0.5);
  TestValidator.equals("stand gait", take.gait, "stand");
  TestValidator.equals("held phase count", take.poses.length, 3);
  TestValidator.predicate(
    "authored duration and no stride",
    (): boolean =>
      nclose(take.periodSeconds, 2) && nclose(take.strideMeters ?? NaN, 0),
  );
  for (const [phase, pose] of take.poses.entries()) {
    TestValidator.equals(
      `phase ${phase} skeleton`,
      pose.skeleton,
      body.skeleton.id,
    );
    TestValidator.predicate(
      `phase ${phase} is centred and faces +Z`,
      (): boolean =>
        pose.root !== null &&
        nclose(pose.root.translation.x, 0) &&
        nclose(pose.root.translation.z, 0) &&
        qclose(pose.root.rotation, { x: 0, y: 0, z: 0, w: 1 }),
    );
    TestValidator.predicate(
      `phase ${phase} keeps the settled joints`,
      (): boolean =>
        pose.joints.length === settled.joints.length &&
        pose.joints.every((j: IAutoMovieJointPose, i: number): boolean => {
          const reference: IAutoMovieJointPose = settled.joints[i]!;
          return (
            j.bone === reference.bone &&
            nclose(j.flexion ?? 0, reference.flexion ?? 0) &&
            nclose(j.abduction ?? 0, reference.abduction ?? 0) &&
            nclose(j.twist ?? 0, reference.twist ?? 0)
          );
        }),
    );
  }

  // 2. The take needs an active stand and an integral phase count.
  for (const [from, samples, axis] of [
    [2, 3, "standing"],
    [0, 1.5, "samples"],
  ] as const) {
    let refusal: unknown;
    try {
      HumanPopulation.standing(performance, "template", from, samples);
    } catch (error) {
      refusal = error;
    }
    TestValidator.equals(
      `refusal at ${from} with ${samples} phases`,
      refusal instanceof HumanRefusal
        ? [refusal.performer, refusal.axis]
        : undefined,
      ["template", axis],
    );
  }
}
