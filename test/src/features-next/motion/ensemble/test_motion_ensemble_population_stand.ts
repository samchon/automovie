import type {
  IAutoMovieFormationPoseTake,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanEnsemble,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { qclose } from "../../../features/internal/qclose";

/**
 * Population extras can hold a foreground template's settled standing pose.
 *
 * Scenarios:
 * 1. Hold a two-second stand performed away from the origin and facing +X.
 *    Its three output phases carry the settled articulation at the slot
 *    origin facing +Z, with a two-second period and zero stride. The take
 *    selects the stand at 0.25 seconds, ahead of its settled instant.
 * 2. The end of the stand is outside its placed interval, and a fractional
 *    phase count is refused without reading a pose.
 * 3. A short final stand is still displayed at its settled event. A short
 *    stand with a successor at that event is unavailable as a take.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the performed stand, its frame, the held pose invariants and the refusal cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public standing take producer on a scheduled stand. Slot placement, phase count, timing and the articulated pose are observable in the take passed to the population consumer.
 * @evidence contracts/development/testing.md#independent-expectations The period is the authored two seconds, a held stand travels zero metres, and the known upright +X placement becomes the identity rotation facing +Z. The stand law's documented half-second settle gives the reference articulation; the stand law's biomechanics are tested elsewhere.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a placed and rotated template, multiple held phases, the end-exclusive selection interval, malformed sample count, a final settled endpoint and an endpoint owned by a successor. The existing ensemble population spec covers the moving cycle.
 * @evidence contracts/development/testing.md#execution-ownership A discovered motion feature unit constructs one in-memory HumanPerformance and reads settled instants and their take eligibility. It starts no viewer, host or render.
 */
export function test_motion_ensemble_population_stand(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const template: IAutoMovieMotionHumanPerformer = {
    subject: "template",
    body,
    at: { x: 8, y: 0, z: -3 },
    yaw: 90,
    proficiency: { level: "trained" },
  };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "held-standing-population",
    performers: [
      template,
      { ...template, subject: "short-final", at: { x: 10, y: 0, z: -3 } },
      { ...template, subject: "short-then-stand", at: { x: 12, y: 0, z: -3 } },
    ],
    composition: HumanChain.subject("template")
      .stand({ hold: 2 })
      .with(
        HumanChain.subject("short-final").stand({ hold: 0.25 }),
        HumanChain.subject("short-then-stand")
          .stand({ hold: 0.25 })
          .stand({ hold: 1 }),
      ).node,
  });

  // 1. The same held articulation fills each of the population take's phases.
  const take: IAutoMovieFormationPoseTake =
    AutoMovieMotionHumanEnsemble.HumanPopulation.standing(
      performance,
      "template",
      0.25,
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

  // 2. Selection still needs an active stand and an integral phase count.
  // 3. The event itself may be at the end, if the stand is still displayed.
  const short: IAutoMovieFormationPoseTake =
    AutoMovieMotionHumanEnsemble.HumanPopulation.standing(
      performance,
      "short-final",
      0,
      1,
    );
  TestValidator.predicate(
    "the settled endpoint of a short final stand can supply a take",
    nclose(short.periodSeconds, 0.25) && short.poses.length === 1,
  );
  for (const [subject, from, samples, axis] of [
    ["template", 2, 3, "standing"],
    ["template", 0, 1.5, "samples"],
    ["short-then-stand", 0, 3, "standing"],
  ] as const) {
    let refusal: unknown;
    try {
      AutoMovieMotionHumanEnsemble.HumanPopulation.standing(
        performance,
        subject,
        from,
        samples,
      );
    } catch (error) {
      refusal = error;
    }
    TestValidator.equals(
      `${subject} refusal at ${from} with ${samples} phases`,
      refusal instanceof HumanRefusal
        ? [refusal.performer, refusal.axis]
        : undefined,
      [subject, axis],
    );
  }
}
