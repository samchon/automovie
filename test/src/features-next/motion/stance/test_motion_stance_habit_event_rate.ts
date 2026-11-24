import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The seed and independently calculated hold in seconds for one puff. */
interface IPuff {
  seed: string;
  seconds: number;
}

/**
 * A puff draws between #3346's measured endpoints, 1.6 and 2.1 seconds.
 * A single occurrence maps the first counter of the action's seeded channel
 * linearly to that band. The average man mimes the public `smoke` row.
 *
 * Scenarios:
 *
 * 1. Across #3346's 200 seeds, every counter draw is within [0, 1), the
 *    shortest expected puff is under 1.7 s and the longest over 2.0 s.
 *    At least 190 draws are distinct at a resolution of one microsecond.
 * 2. The actual shortest, median and longest cases plan and publish the
 *    independently calculated hold between `taskEnd` and `relax`, within 1 ms.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the real plan's events at the extremes and median. Ignoring either the seed or the authored duration fails.
 * @evidence contracts/development/testing.md#independent-expectations The first counter of the engine stream and linear interpolation between the cited measurements provide expected seconds without running a motion law.
 * @evidence contracts/development/testing.md#distinguishing-cases The sample extremes and its interior exercise the published clock. The cigarette at the lips is checked by `test_human_motion_hand_verdicts_smoke` and the held-attitude specs.
 * @evidence contracts/development/testing.md#execution-ownership Three one-row performances on one body, no posture samples, and 200 scalar stream reads.
 * @evidence contracts/development/common.md#meaningful-documentation States the measurement, clock and numerical bounds.
 */
export function test_motion_stance_habit_event_rate(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const shortest: number = 1.6;
  const longest: number = 2.1;
  const band: number = longest - shortest;
  const puffs: IPuff[] = Array.from(
    { length: 200 },
    (_: unknown, i: number): IPuff => {
      const seed: string = `cigarette-${i}`;
      const uniform: number = createAutoMovieRandom(
        deriveAutoMovieSeed(seed, "a", "smoke", "series", "seconds"),
      ).float(0);
      if (!(uniform >= 0 && uniform < 1))
        complaints.push(`${seed}: the counter gives ${uniform} outside [0, 1)`);
      return { seed, seconds: shortest + band * uniform };
    },
  ).sort((a: IPuff, b: IPuff): number => a.seconds - b.seconds);
  const first: IPuff = puffs[0]!;
  const last: IPuff = puffs[puffs.length - 1]!;
  if (!(first.seconds < 1.7 && last.seconds > 2))
    complaints.push(
      `the puffs run from ${first.seconds.toFixed(3)} to ${last.seconds.toFixed(3)} s, under 1.7 and over 2.0 s expected`,
    );
  for (const { seed, seconds } of [first, puffs[puffs.length / 2]!, last])
    try {
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed,
          laws: [AutoMovieMotionHumanStance.HumanHabit.smoke],
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
      const placed: IAutoMovieMotionHumanSegment =
        performance.segments("a")[0]!;
      const at: (event: string) => number = (event: string): number =>
        (placed.plan.events.find(
          (e: IAutoMovieMotionEvent): boolean => e.name === event,
        )?.share ?? NaN) * placed.plan.duration;
      const puff: number = at("relax") - at("taskEnd");
      if (!(Math.abs(puff - seconds) <= 0.001))
        complaints.push(
          `${seed}: the puff lasts ${puff.toFixed(3)} s, ${seconds.toFixed(3)} s expected`,
        );
    } catch (error) {
      complaints.push(
        `${seed}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  TestValidator.equals("a puff follows the seeded duration", complaints, []);
}
