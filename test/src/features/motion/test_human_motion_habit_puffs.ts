import {
  HumanChain,
  HumanHabit,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A puff on a cigarette lasts as long as measured puffs do, and each seed
 * draws its own (#3346's smoking topography: mean puff durations of 1.6 to
 * 2.1 s).
 *
 * One body, the average man, mimes the `smoke` row without a cigarette; each
 * seed builds the plan and reads its events, no posture, so the 200 seeds
 * #3346 asks for run in well under a minute. A cigarette's count of puffs,
 * the intervals between them and the decline of the puff over the cigarette
 * are a composition of this row with rests, and are not read here.
 *
 * Scenarios, over seeds 0 to 199:
 * 1. Every seed plans.
 * 2. Every puff, from `taskEnd` to `relax`, lasts between 1.6 and 2.1 s
 *    within 1 ms.
 * 3. The puffs spread over the band: the shortest is under 1.7 s and the
 *    longest over 2.0 s.
 * 4. At least 190 of the 200 differ from every other by more than a
 *    microsecond.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two hundred performances through the public chain and reads each plan's events; a puff of one fixed length, a puff outside the measured band or seeds that are ignored fail.
 * @evidence contracts/development/testing.md#independent-expectations The band is #3346's cited range and the 200 seeds its count; the spread's two ends and the count of distinct values are the test's own, stated here.
 * @evidence contracts/development/testing.md#distinguishing-cases Two hundred seeds of one row; the cigarette at the lips is `test_human_motion_hand_verdicts_smoke`'s and `test_human_motion_prop_held_attitude`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds 200 one-row performances without reading a posture; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule with its source, what is not read, why no posture is read and the 4 scenarios with their bounds.
 */
export function test_human_motion_habit_puffs(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const puffs: number[] = [];
  for (let i: number = 0; i < 200; i++)
    try {
      const performance: HumanPerformance = new HumanPerformance({
        seed: `cigarette-${i}`,
        laws: [HumanHabit.smoke],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").registered("smoke", {}).node,
      });
      const placed: HumanSegment.ISegment = performance.segments("a")[0]!;
      const at = (event: string): number =>
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) * placed.plan.duration;
      const puff: number = at("relax") - at("taskEnd");
      puffs.push(puff);

      // 2. Inside the measured band.
      if (!(puff >= 1.6 - 0.001 && puff <= 2.1 + 0.001))
        complaints.push(
          `seed ${i}: the puff lasts ${puff.toFixed(3)} s, between 1.6 and 2.1 s expected`,
        );
    } catch (error) {
      // 1. Every seed plans.
      complaints.push(
        `seed ${i}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }

  // 3. The band is used.
  const sorted: number[] = [...puffs].sort(
    (a: number, b: number): number => a - b,
  );
  if (sorted.length > 0 && !(sorted[0]! < 1.7 && sorted.at(-1)! > 2.0))
    complaints.push(
      `the puffs run from ${sorted[0]!.toFixed(3)} to ${sorted.at(-1)!.toFixed(3)} s, under 1.7 and over 2.0 s expected`,
    );

  // 4. The seeds differ.
  let distinct: number = sorted.length === 0 ? 0 : 1;
  for (let i: number = 1; i < sorted.length; i++)
    if (sorted[i]! - sorted[i - 1]! > 1e-6) distinct++;
  if (!(distinct >= 190))
    complaints.push(
      `${distinct} of ${puffs.length} puffs are distinct, at least 190 expected`,
    );
  TestValidator.equals(
    "a puff over two hundred seeds",
    complaints.slice(0, 12),
    [],
  );
}
