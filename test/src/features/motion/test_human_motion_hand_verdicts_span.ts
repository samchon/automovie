import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanVerdicts,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * `HumanVerdicts.of` reads a span of a film as a film of its own and refuses
 * a span that is not one, so a long film can be read in parts by specs that
 * each run within the time a test may take.
 *
 * The average man stands quietly for one second.
 *
 * Scenarios:
 * 1. The whole film and its middle half, 0.25 to 0.75 s, both report clean.
 * 2. A span that starts after the film ends, or that ends before it starts,
 *    is refused with `HumanRefusal`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the shipped report over a span of a real performance and calls it with spans that are not spans; a span read as the whole film, or a bad span read instead of refused, fails.
 * @evidence contracts/development/testing.md#independent-expectations A quiet stance holds every bound by construction, and a span must lie within the film by definition.
 * @evidence contracts/development/testing.md#distinguishing-cases The whole film, an inner span, a span past the film and a reversed span.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and reads one second of standing; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the reading, the stage and the 2 scenarios.
 */
export function test_human_motion_hand_verdicts_span(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const performance: HumanPerformance = new HumanPerformance({
    seed: "span",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ seconds: 1 }).node,
  });

  // 1. clean over the whole film and over its middle half
  for (const span of [undefined, { from: 0.25, to: 0.75 }])
    TestValidator.equals(
      `a quiet stance reports clean over ${span === undefined ? "the whole film" : "0.25 to 0.75 s"}`,
      HumanVerdicts.describe(HumanVerdicts.of(performance, 24, span)),
      "clean",
    );

  // 2. spans that are not spans
  for (const span of [
    { from: performance.duration + 1, to: performance.duration + 2 },
    { from: 0.75, to: 0.25 },
  ]) {
    let refused: boolean = false;
    try {
      HumanVerdicts.of(performance, 24, span);
    } catch (error) {
      refused = error instanceof HumanRefusal;
    }
    TestValidator.predicate(
      `the span ${span.from} to ${span.to} s is refused`,
      refused,
    );
  }
}
