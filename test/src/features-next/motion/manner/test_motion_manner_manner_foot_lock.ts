import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { AutoMovieMotionManner } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Weary walking and obstacle clearance preserve planted feet and skin clearance.
 *
 * Scenarios:
 * 1. The small actor performs the original obstacle or stair crossing.
 * 2. The average actor performs the original flat-floor carrier.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the two source actors and the public support outcomes.
 * @evidence contracts/development/testing.md#behavioral-verification Plans each actual action and evaluates its contact and clearance over the independently posed frame sequence.
 * @evidence contracts/development/testing.md#independent-expectations Planted feet stay within the public floor-relative slip limit, and anatomy stays within the separate skin margin.
 * @evidence contracts/development/testing.md#distinguishing-cases These two geometry and support branches have different admission and contact histories.
 * @evidence contracts/development/testing.md#execution-ownership One actual public plan per historical failing input.
 */
export function test_motion_manner_manner_foot_lock(): void {
  const findings: string[] = [];
  const box: IAutoMovieMotionHumanProp = {
    subject: "box",
    frame: {
      position: { x: 0, y: 0, z: 0.6 },
      rotation: { x: 0, y: 1, z: 0, w: 0 },
    },
    points: {},
    affordances: [
      {
        id: "edge",
        kind: "ledge",
        frame: {
          translation: { x: 0, y: 0.3, z: 0.25 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
      },
      {
        id: "top",
        kind: "surface",
        frame: {
          translation: { x: 0, y: 0.3, z: 0.125 },
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: { x: 1, y: 1, z: 1 },
        },
        extent: null,
        depth: 0.25,
      },
    ],
  };
  for (const name of ["f-small", "m-average"] as const) {
    const body = motionHumanBody(name);
    const actor = HumanChain.subject("a");
    const manner = AutoMovieMotionManner.PRESETS.weary;
    const chain =
      name === "f-small"
        ? actor.stepOver({ obstacle: "box", manner })
        : actor.walk({ to: { x: 0, y: 0, z: 3 }, manner });
    try {
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "recompose-travel",
          props: name === "f-small" ? [box] : [],
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

      const verdict = HumanVerdicts.of(performance);
      if (!verdict.clean)
        findings.push(name + ": " + HumanVerdicts.describe(verdict));
    } catch (error) {
      findings.push(name + ": " + String(error));
    }
  }
  TestValidator.equals(
    "the composed support and exposed limb remain admissible",
    findings,
    [],
  );
}
