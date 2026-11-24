import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * The standing side stretch takes the same overhead arm course with the
 * prepared source frame and the original authoring reader.
 *
 * Scenarios:
 * 1. The actual spine bends laterally as both arms travel.
 * 2. Both arms agree with the original posture reader during reach, hold
 *    and return on two bodies facing away from the world forward axis.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the changing trunk and the world heading and phases of the comparison.
 * @evidence contracts/development/testing.md#behavioral-verification Observes articulated arms and spine through the public performance and the published segment's ordinary reader.
 * @evidence contracts/development/testing.md#independent-expectations The ordinary reader with an explicit projector supplies numerical parity. Nonzero lateral spine inclination distinguishes a genuinely moving chest.
 * @evidence contracts/development/testing.md#distinguishing-cases Tests both arms, two body sizes, nonzero heading and fractions inside each phase.
 * @evidence contracts/development/testing.md#execution-ownership Each body has its own performance and posture readers. The shared body fixtures remain read-only.
 */
export function test_motion_workout_stretch_overhead_phase(): void {
  for (const name of ["f-small", "m-average"] as const) {
    const body = motionHumanBody(name);
    const film = new HumanPerformance({
      seed: "overhead stretch phase",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0.1, y: 0, z: -0.3 },
          yaw: -23,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").act("stretch", {
        kind: "overheadSide",
        hold: 0.57,
      }).node,
    });
    const plan = film.segments("a")[0]!.plan;
    const event = (name: string): number =>
      plan.duration * plan.events.find((entry) => entry.name === name)!.share;
    const reach: number = event("reachEnd");
    const release: number = event("release");
    TestValidator.predicate(
      "spine laterally bends during the stretch",
      Math.abs(film.posture("a", reach).joints.spine?.[1] ?? 0) > 0,
    );
    for (const seconds of [
      reach * 0.417,
      (reach + release) / 2,
      (release + plan.duration) / 2,
    ]) {
      const prepared: IAutoMovieMotionHumanPosture = film.posture("a", seconds);
      const ordinary: IAutoMovieMotionHumanPosture = plan.posture(
        seconds,
        undefined,
        undefined,
        body.projection,
      );
      for (const bone of [
        "leftUpperArm",
        "leftLowerArm",
        "leftHand",
        "rightUpperArm",
        "rightLowerArm",
        "rightHand",
      ] as const) {
        const angles = prepared.joints[bone]!;
        const original = ordinary.joints[bone]!;
        TestValidator.predicate(
          `${bone} follows the original course at ${seconds}s`,
          angles.every((value: number, i: number) =>
            nclose(value, original[i]!),
          ),
        );
      }
    }
  }
}
