import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * An arm overlay on stairs and on a left-handed carry preserves carrier
 * support.
 *
 * Scenarios:
 *
 * 1. The small actor performs the original obstacle or stair crossing.
 * 2. The average actor performs the original flat-floor carrier.
 * 3. A two-hand clap takes both free arms while a walk keeps its foot contacts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two source actors and the public support outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Plans each actual action and evaluates its contact and clearance over the independently posed frame sequence.
 * @evidence contracts/development/testing.md#independent-expectations Planted feet stay within the public floor-relative slip limit, and anatomy stays within the separate skin margin.
 * @evidence contracts/development/testing.md#distinguishing-cases These two geometry and support branches have different admission and contact histories.
 * @evidence contracts/development/testing.md#execution-ownership One actual public plan per historical failing input.
 */
export function test_motion_posture_slope_overlay(): void {
  const findings: string[] = [];
  const subject = HumanChain.subject("a");
  const run = (
    name: motionHumanBody.Name,
    carrier: IAutoMovieMotionHumanChain,
    overlay: (part: IAutoMovieMotionHumanChain) => IAutoMovieMotionHumanChain,
  ): void => {
    try {
      const body = motionHumanBody(name);
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "recompose-travel",
          props: [],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: carrier.over(overlay).node,
        });
      TestValidator.equals(
        "travel retains the declared overlay",
        performance.overlays("a").length,
        1,
      );
      const verdict = HumanVerdicts(performance);
      if (!verdict.clean)
        findings.push(name + ": " + HumanVerdicts.describe(verdict));
    } catch (error) {
      findings.push(name + ": " + String(error));
    }
  };
  const wave = (part: IAutoMovieMotionHumanChain) =>
    part.gesture({ kind: "wave", hand: "right" });
  run("f-small", subject.climbStairs({ count: 4, direction: "up" }), wave);
  run(
    "m-average",
    subject.carry({
      to: { x: 0, y: 0, z: 2.5 },
      kind: "oneHand",
      hand: "left",
      load: 0.15,
    }),
    wave,
  );
  run("m-average", subject.walk({ to: { x: 0, y: 0, z: 2.5 } }), (part) =>
    part.gesture({ kind: "clap" }),
  );
  TestValidator.equals(
    "one- and two-hand overlays preserve support",
    findings,
    [],
  );
}
