import type { IAutoMovieMotionEvent } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A walk's strides are nearly, not exactly, alike: a healthy adult's stride
 * time varies by 1 to 3 % from stride to stride, a march's less than a
 * walk's, and the same seed gives the same strides.
 *
 * A stride is the time between two heel strikes of the same foot, at the
 * instants the gait names them; at three of them the displayed foot is
 * checked to be up a 12th of a second before and to bear a 24th after, so
 * the named strikes are the ones the body shows. Its variation is the
 * standard deviation of the stride times over their mean, over the strides
 * between the first two and the last two steps of a 16 m way.
 *
 * Scenarios, on the average man and the small woman at trained proficiency:
 * 1. The neutral walk's stride-time coefficient of variation lies between
 *    1 and 3 % (healthy young adults; Hausdorff, as the manner presets'
 *    acceptance cites it).
 * 2. A march over the same way varies less than the walk: a drill keeps
 *    time (the same acceptance; the direction only).
 * 3. The walk under another seed has other stride times, and under the same
 *    seed the same ones to the sampling step: a seed varies the take and
 *    replays it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the gaits through the public chain on real bodies and reads the stride times off the displayed feet; a walk whose strides are identical, a walk that scatters like an impaired gait, a march looser than a walk or a seed that changes nothing fails.
 * @evidence contracts/development/testing.md#independent-expectations The 1 to 3 % band is the cited measurement of healthy gait and the rest are what a drill and a seed mean; nothing is read from the walk's jitter constants. Limitation: about nine strides are read per walk, so the estimate of the variation is itself coarse; and the strike instants are the gait's own events, tied to the displayed foot within a frame at three of them, since reading every strike off the display costs thousands of poses.
 * @evidence contracts/development/testing.md#distinguishing-cases A band with a lower and an upper edge, a comparison between two gaits, a seed changed and a seed repeated, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four performances each in memory; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States how a stride and its variation are read, the reading's resolution, and the 3 scenarios with their bounds and source.
 */
export function test_human_motion_travel_stride_variation(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const strides = (row: string | null, seed: string): number[] => {
      const standing: HumanChain = HumanChain.subject("a").stand({
        seconds: 0.3,
      });
      const to: { x: number; y: number; z: number } = { x: 0, y: 0, z: 16 };
      const performance: HumanPerformance = new HumanPerformance({
        seed,
        laws: [...HUMAN_LEXICON.gait!],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: (row === null
          ? standing.walk({ to })
          : standing.registered(row, { to })
        ).node,
      });
      const segment: HumanSegment.ISegment = performance.segments("a")[1]!;
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );
      const strikes: { seconds: number; side: "left" | "right" }[] =
        segment.plan.events
          .filter((e: IAutoMovieMotionEvent): boolean =>
            /^(left|right)HeelStrike\d+$/.test(e.name),
          )
          .map(
            (
              e: IAutoMovieMotionEvent,
            ): { seconds: number; side: "left" | "right" } => ({
              seconds: segment.start + e.share * segment.plan.duration,
              side: e.name.startsWith("left") ? "left" : "right",
            }),
          )
          .sort(
            (
              a: { seconds: number; side: "left" | "right" },
              b: { seconds: number; side: "left" | "right" },
            ): number => a.seconds - b.seconds,
          );

      // Stride times of each foot, without the first two and the last two steps of the way.
      const steady: { seconds: number; side: "left" | "right" }[] =
        strikes.slice(2, -2);

      // The body shows the footfalls it names: about each of three strikes the foot is off the floor a 12th of a second before and bears a 24th after.
      for (const strike of [0.25, 0.5, 0.75].map(
        (share: number): { seconds: number; side: "left" | "right" } =>
          steady[Math.floor(share * steady.length)]!,
      ))
        if (
          HumanSignature.bears(reader, strike.seconds - 1 / 12, strike.side) ||
          !HumanSignature.bears(reader, strike.seconds + 1 / 24, strike.side)
        )
          throw new Error(
            `the ${strike.side} foot's named strike at ${strike.seconds.toFixed(2)} s of ${row ?? "walk"} is not shown: the foot must be up a 12th of a second before and bear a 24th after`,
          );
      const out: number[] = [];
      for (const side of ["left", "right"] as const) {
        const mine: number[] = steady
          .filter(
            (s: { seconds: number; side: "left" | "right" }): boolean =>
              s.side === side,
          )
          .map(
            (s: { seconds: number; side: "left" | "right" }): number =>
              s.seconds,
          );
        for (let i: number = 1; i < mine.length; ++i)
          out.push(mine[i]! - mine[i - 1]!);
      }
      return out;
    };
    const variation = (times: readonly number[]): number => {
      const mean: number =
        times.reduce((sum: number, t: number): number => sum + t, 0) /
        times.length;
      const spread: number = Math.sqrt(
        times.reduce(
          (sum: number, t: number): number => sum + (t - mean) * (t - mean),
          0,
        ) /
          (times.length - 1),
      );
      return spread / mean;
    };
    let walk: number[];
    let march: number[];
    let other: number[];
    let again: number[];
    try {
      walk = strides(null, "strides");
      march = strides("march", "strides");
      other = strides(null, "strides-2");
      again = strides(null, "strides");
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    if (walk.length < 6 || march.length < 6) {
      complaints.push(
        `${name}: ${walk.length} walk strides and ${march.length} march strides read, at least 6 of each expected over 16 m`,
      );
      continue;
    }

    // 1. A healthy walk's variation.
    const walking: number = variation(walk);
    if (walking < 0.01 || walking > 0.03)
      complaints.push(
        `${name}: the walk's stride time varies by ${(walking * 100).toFixed(2)} %, 1 to 3 % expected`,
      );

    // 2. A march keeps time.
    const marching: number = variation(march);
    if (!(marching < walking))
      complaints.push(
        `${name}: the march's stride time varies by ${(marching * 100).toFixed(2)} % and the walk's by ${(walking * 100).toFixed(2)} %, less for the march expected`,
      );

    // 3. A seed varies the take and replays it.
    const differs = (a: readonly number[], b: readonly number[]): number =>
      a.length !== b.length
        ? Infinity
        : Math.max(
            ...a.map((t: number, i: number): number => Math.abs(t - b[i]!)),
          );
    if (differs(walk, again) > 1e-9)
      complaints.push(
        `${name}: the same seed gives stride times that differ by ${differs(walk, again).toExponential(2)} s`,
      );
    if (!(differs(walk, other) > 1e-4))
      complaints.push(
        `${name}: another seed gives the same stride times within 0.1 ms`,
      );
  }
  TestValidator.equals("strides vary as a healthy gait's do", complaints, []);
}
