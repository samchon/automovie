import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { HumanPreparedPlayback } from "../../../../packages/motions/src/perform/HumanPreparedPlayback";
import { motionHumanBody } from "../internal/motionHumanBody";
import { vclose } from "../internal/vclose";

/**
 * Native stepping playback reads the original gait at its placed action second.
 *
 * Scenarios:
 * 1. Seek across both endpoints and the footfall events of a fast walk and a sprint.
 * 2. Pass a different reader and check that it cannot use the plan's playback.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the clocks, gaits and posture properties compared.
 * @evidence contracts/development/testing.md#behavioral-verification Checks native admission, root, foot goals and bearing with the original writer and checks callback identity.
 * @evidence contracts/development/testing.md#independent-expectations The public posture reader and declared gait events supply the expected geometry and query times.
 * @evidence contracts/development/testing.md#distinguishing-cases Action endpoints, stance and swing reads, and a foreign reader distinguish an absent, mistimed or overly permissive binding.
 * @evidence contracts/development/testing.md#execution-ownership Constructs two real in-memory films without replacing their writers.
 */
export function test_motion_posture_gait_playback(): void {
  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const to: IAutoMovieVector3 = { x: 0, y: 0, z: 4 };
  const chains: readonly HumanChain[] = [
    HumanChain.subject("a").walk({ to, pace: "fast" }),
    HumanChain.subject("a").run({ to, pace: "sprint" }),
  ];
  for (const chain of chains) {
    const film: HumanPerformance = new HumanPerformance({
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
    });
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    const plan: IAutoMovieMotionHumanActionPlan = segment.plan;
    const seconds: readonly number[] = [
      plan.duration,
      0,
      ...plan.events.map((event): number => event.share * plan.duration),
      plan.duration * 0.35,
    ];
    for (const at of seconds) {
      const native: IAutoMovieMotionHumanPlayback.ISample | undefined =
        HumanPreparedPlayback.read(
          plan,
          body,
          plan.posture,
          true,
          true,
          undefined,
          at,
        );
      if (native === undefined)
        throw new Error(`Missing gait playback at ${at} s`);
      const authored: IAutoMovieMotionHumanPosture = plan.posture(at);
      TestValidator.predicate(
        "the gait keeps its root",
        vclose(native.posture.root, authored.root),
      );
      for (const leg of ["leftLeg", "rightLeg"] as const) {
        const got: IAutoMovieMotionHumanPosture["limbs"][typeof leg] =
          native.posture.limbs[leg];
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
    }
    const other: IAutoMovieMotionHumanActionPlan["posture"] = (at) =>
      plan.posture(at);
    TestValidator.predicate(
      "a different callback is ineligible",
      HumanPreparedPlayback.read(
        plan,
        body,
        other,
        true,
        true,
        undefined,
        0,
      ) === undefined,
    );
  }
}
