import {
  HumanChain,
  HumanEmblem,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An emblem varies by seed inside a band and never repeats (#3345's seed
 * and variation line): over 200 seeds the `halt` emblem's preparation keeps
 * near its unvaried length, and the seeds do not give one film.
 *
 * One body, the average man; each seed builds the plan and reads its events,
 * no posture, so two hundred performances stay short.
 *
 * Scenarios, `halt` with `manner: { variation: 1 }` over seeds 0 to 199:
 * 1. Every seed plans.
 * 2. Every seed's preparation (the start to `strokeStart`) lasts between
 *    0.5 and 1.5 of the unvaried row's (provisional band: a varied
 *    preparation is still the same reach).
 * 3. The stroke itself (`strokeStart` to `strokeEnd`) keeps the unvaried
 *    row's length within 1 ms: only the preparation varies.
 * 4. At least 190 of the 200 preparations differ from every other by more
 *    than a microsecond.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two hundred performances through the public chain and reads each plan's events; a seed that is ignored, a preparation outside its band or a stroke whose length moves fails.
 * @evidence contracts/development/testing.md#independent-expectations The 200 seeds and the two claims are #3345's; the band and the count of distinct values are provisional and stated as such.
 * @evidence contracts/development/testing.md#distinguishing-cases The varied row against the same row unvaried; a place's variation is `variationCases`'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds 201 one-row performances without reading a posture; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, why no posture is read and the 4 scenarios with their bounds.
 */
export function test_human_motion_emblem_seeds(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];

  /** A seed's preparation and stroke lengths, seconds. */
  const read = (seed: string, variation: number): [number, number] => {
    const performance: HumanPerformance = new HumanPerformance({
      seed,
      laws: [HumanEmblem.halt],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").registered(
        "halt",
        variation === 0 ? {} : { manner: { variation } },
      ).node,
    });
    const placed: HumanSegment.ISegment = performance.segments("a")[0]!;
    const at = (event: string): number =>
      (placed.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) * placed.plan.duration;
    return [at("strokeStart"), at("strokeEnd") - at("strokeStart")];
  };
  const [named, stroke] = read("plain", 0);
  const prepared: number[] = [];
  for (let i: number = 0; i < 200; i++)
    try {
      const [prepare, struck] = read(`seed-${i}`, 1);
      prepared.push(prepare);

      // 2. Inside the band.
      if (!(prepare >= 0.5 * named && prepare <= 1.5 * named))
        complaints.push(
          `seed ${i}: the preparation lasts ${prepare.toFixed(3)} s, between ${(0.5 * named).toFixed(3)} and ${(1.5 * named).toFixed(3)} s expected`,
        );

      // 3. The stroke keeps its length.
      if (!(Math.abs(struck - stroke) <= 0.001))
        complaints.push(
          `seed ${i}: the stroke lasts ${struck.toFixed(4)} s, the unvaried ${stroke.toFixed(4)} s within 1 ms expected`,
        );
    } catch (error) {
      // 1. Every seed plans.
      complaints.push(
        `seed ${i}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

  // 4. The seeds differ.
  const sorted: number[] = [...prepared].sort(
    (a: number, b: number): number => a - b,
  );
  let distinct: number = sorted.length === 0 ? 0 : 1;
  for (let i: number = 1; i < sorted.length; i++)
    if (sorted[i]! - sorted[i - 1]! > 1e-6) distinct++;
  if (!(distinct >= 190))
    complaints.push(
      `${distinct} of ${prepared.length} preparations are distinct, at least 190 expected`,
    );
  TestValidator.equals(
    "an emblem over two hundred seeds",
    complaints.slice(0, 12),
    [],
  );
}
