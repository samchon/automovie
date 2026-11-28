import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanChain,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";

import {
  composeHumanSlowDanceSway
} from "../../../../../packages/motions/src/touch/internal/composeHumanSlowDanceSway";
import { TestValidator } from "@nestia/e2e";

/**
 * Check how a sway request expands into alternating weight shifts.
 *
 * Scenarios:
 *
 * 1. Two counts of 0.04 m on a one-second beat append four alternating signed
 *    shifts. Each shift has a half-second outward and return interval.
 * 2. Refuse a count of zero on `count` .
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases specify count, displacement, tempo and the invalid count.
 * @evidence contracts/development/testing.md#behavioral-verification The chain's actual appended intents are compared in order and its count gate is exercised.
 * @evidence contracts/development/testing.md#independent-expectations Two sides per count and two half beats per shift determine the sequence and timing.
 */
export function test_motions_touch_compose_human_slow_dance_sway(): void {
  const intents = (node: IAutoMovieComposition): IAutoMovieIntent[] => {
    if (node.type === "intent") return [node.intent];
    if (node.type === "sequence" || node.type === "parallel")
      return node.parts.flatMap(intents);
    return [];
  };
  TestValidator.equals(
    "two sways",
    intents(
      composeHumanSlowDanceSway(AutoMovieMotionHumanChain.subject("a"), {
        by: 0.04,
        beat: 1,
        count: 2,
      }).node,
    ).map((intent: IAutoMovieIntent) => intent.parameters?.params),
    [0.04, -0.04, 0.04, -0.04].map((by: number) => ({
      by,
      duration: 0.5,
      returnSeconds: 0.5,
    })),
  );
  let refused: boolean = false;
  try {
    composeHumanSlowDanceSway(AutoMovieMotionHumanChain.subject("a"), {
      by: 0.04,
      beat: 1,
      count: 0,
    });
  } catch (error: unknown) {
    refused = error instanceof AutoMovieMotionHumanRefusal && error.axis === "count";
  }
  TestValidator.predicate("no sway", refused);
}
