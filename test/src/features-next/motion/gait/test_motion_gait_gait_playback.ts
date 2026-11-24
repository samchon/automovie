import { integrateAirborneRotation } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";
import { deepStrictEqual } from "node:assert/strict";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { vclose } from "../../../features/internal/vclose";

/**
 * Native stepping playback reads the original gait at its placed action second.
 *
 * Scenarios:
 * 1. Seek across both endpoints and the footfall events of a fast walk and a sprint.
 * 2. Compare a separate film using a replacement callback with the original film.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the clocks, gaits and posture properties compared.
 * @evidence contracts/development/testing.md#behavioral-verification Compares the public display, root and foot goals, and confirms display invokes the replacement reader.
 * @evidence contracts/development/testing.md#independent-expectations The public posture reader and declared gait events supply the expected geometry and query times.
 * @evidence contracts/development/testing.md#distinguishing-cases Endpoints, stance and swing reads cover both gaits. Counting calls proves that the changed callback runs in the reference film.
 * @evidence contracts/development/testing.md#execution-ownership Uses independent film instances and replaces only the publicly returned reference plan's callback.
 */
export function test_motion_gait_gait_playback(): void {
  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const to: IAutoMovieVector3 = { x: 0, y: 0, z: 4 };
  const chains: readonly IAutoMovieMotionHumanChain[] = [
    HumanChain.subject("a").walk({ to, pace: "fast" }),
    HumanChain.subject("a").run({ to, pace: "sprint" }),
  ];
  for (const chain of chains) {
    const input: ConstructorParameters<typeof HumanPerformance>[0] = {
      seed: "gait-playback",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: chain.node,
    };
    const film: HumanPerformance = new HumanPerformance(
      input,
      integrateAirborneRotation.observe(),
    );
    const reference: HumanPerformance = new HumanPerformance(
      input,
      integrateAirborneRotation.observe(),
    );
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    const expected: IAutoMovieMotionHumanSegment = reference.segments("a")[0]!;
    const plan: IAutoMovieMotionHumanActionPlan = segment.plan;
    const ordinary: IAutoMovieMotionHumanActionPlan["posture"] =
      expected.plan.posture;
    let fallbackReads: number = 0;
    expected.plan.posture = function (
      this: IAutoMovieMotionHumanActionPlan,
      ...args: Parameters<typeof ordinary>
    ): IAutoMovieMotionHumanPosture {
      ++fallbackReads;
      return Reflect.apply(ordinary, this, args);
    };
    const seconds: readonly number[] = [
      plan.duration,
      0,
      ...plan.events.map((event): number => event.share * plan.duration),
      plan.duration * 0.35,
    ];
    for (const at of seconds) {
      const native: IAutoMovieMotionHumanPosture = plan.posture(at);
      const authored: IAutoMovieMotionHumanPosture = Reflect.apply(
        ordinary,
        expected.plan,
        [at],
      );
      TestValidator.predicate(
        "the gait keeps its root",
        vclose(native.root, authored.root),
      );
      for (const leg of ["leftLeg", "rightLeg"] as const) {
        const got: IAutoMovieMotionHumanPosture["limbs"][typeof leg] =
          native.limbs[leg];
        const want: IAutoMovieMotionHumanPosture["limbs"][typeof leg] =
          authored.limbs[leg];
        TestValidator.predicate(
          leg,
          got !== undefined &&
            want !== undefined &&
            got.planted === want.planted &&
            vclose(got.point, want.point),
        );
      }
      deepStrictEqual(
        film.pose("a", segment.start + at),
        reference.pose("a", expected.start + at),
        `${segment.name} at ${at} s`,
      );
    }
    TestValidator.predicate(
      "the reference display calls the replacement callback",
      fallbackReads > 0,
    );
  }
}
