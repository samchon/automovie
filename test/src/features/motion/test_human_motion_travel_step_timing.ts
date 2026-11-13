import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A walk's uneven step timing moves when the feet come down, never where:
 * two takes of one walk under different seeds strike at different instants
 * on the same footprints and stop at the same place, and one seed gives one
 * take.
 *
 * Step-to-step variation in time is a property of the performer's rhythm.
 * The way walked, the places the feet are set and where the walk ends belong
 * to the scene, so a seed must leave them alone.
 *
 * Scenarios, the average man walking 6 m straight ahead after 0.3 s of
 * standing, under the seeds `timing-1` and `timing-2`, and `timing-1` again:
 * 1. The same seed twice names every heel strike at the same instant, to
 *    1e-9 s, and as many of them.
 * 2. The two seeds name as many heel strikes, and at least one of them more
 *    than a millisecond apart.
 * 3. A 24th of a second after each heel strike, the displayed striking
 *    ankle of one seed lies within 2 mm of the other seed's at its own
 *    strike of the same number: the footprints are the same.
 * 4. At the end both takes' hip joints stand within 1 mm of each other
 *    along the way: the same distance was walked.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs one walk three times through the public chain and reads the named heel strikes and the displayed ankles and hips; a timing variation that also moved a footprint or the stop, a seed that changed nothing, or a take that did not replay fails.
 * @evidence contracts/development/testing.md#independent-expectations That a seed varies the take inside the scene and replays it is the vocabulary's stated contract for a seed, not a reading of the walk's tables; the 2 mm and 1 mm are provisional reading margins below the campaign's 5 mm slip bound, so a footprint moved by a foot's slip would show. Limitation: the strike instants are the walk's own events, and the footprints are read at the strikes only.
 * @evidence contracts/development/testing.md#distinguishing-cases A repeated seed, a changed seed, and two spatial readings that must not change with it.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds three short performances in memory, reading about ten instants of two; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds.
 */
export function test_human_motion_travel_step_timing(): void {
  const complaints: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");

  /** One take: its named heel strikes and a reader of its displayed body. */
  interface ITake {
    /** The heel strikes in time order. */
    strikes: { seconds: number; side: "left" | "right" }[];

    /** The reader. */
    reader: HumanSignature.IReader;

    /** The film second the walk ends. */
    end: number;
  }
  const take = (seed: string): ITake => {
    const performance: HumanPerformance = new HumanPerformance({
      seed,
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: 0.3 })
        .walk({ to: { x: 0, y: 0, z: 6 } }).node,
    });
    const segment: HumanSegment.ISegment = performance.segments("a")[1]!;
    return {
      strikes: segment.plan.events
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
        ),
      reader: HumanSignature.of(performance, "a", body, 0),
      end: segment.end,
    };
  };
  const one: ITake = take("timing-1");
  const two: ITake = take("timing-2");
  const again: ITake = take("timing-1");

  // 1. One seed, one take.
  if (one.strikes.length !== again.strikes.length || one.strikes.length < 4)
    complaints.push(
      `the same seed names ${one.strikes.length} and ${again.strikes.length} heel strikes, the same number and at least 4 expected`,
    );
  else {
    const off: number = Math.max(
      ...one.strikes.map(
        (s: { seconds: number }, i: number): number =>
          Math.abs(s.seconds - again.strikes[i]!.seconds),
      ),
    );
    if (off > 1e-9)
      complaints.push(
        `the same seed moves a heel strike by ${off.toExponential(2)} s`,
      );
  }

  // 2 to 4. Another seed: other instants, the same footprints and the same stop.
  if (one.strikes.length !== two.strikes.length)
    complaints.push(
      `two seeds name ${one.strikes.length} and ${two.strikes.length} heel strikes, the same number expected`,
    );
  else {
    const apart: number = Math.max(
      ...one.strikes.map(
        (s: { seconds: number }, i: number): number =>
          Math.abs(s.seconds - two.strikes[i]!.seconds),
      ),
    );
    if (!(apart > 1e-3))
      complaints.push(
        `two seeds name every heel strike within ${(apart * 1000).toFixed(3)} ms of each other, more than 1 ms apart expected somewhere`,
      );
    const after: number = 1 / 24;
    one.strikes.forEach(
      (s: { seconds: number; side: "left" | "right" }, i: number): void => {
        const mine: IAutoMovieVector3 = HumanSignature.joint(
          one.reader,
          s.seconds + after,
          `${s.side}Foot`,
        );
        const theirs: IAutoMovieVector3 = HumanSignature.joint(
          two.reader,
          two.strikes[i]!.seconds + after,
          `${s.side}Foot`,
        );
        const moved: number = Math.hypot(mine.x - theirs.x, mine.z - theirs.z);
        if (moved > 0.002)
          complaints.push(
            `heel strike ${i + 1}: the ${s.side} ankle lands ${(moved * 1000).toFixed(1)} mm apart under the two seeds, within 2 mm expected`,
          );
      },
    );
    const stop = (t: ITake): number =>
      (HumanSignature.joint(t.reader, t.end, "leftUpperLeg").z +
        HumanSignature.joint(t.reader, t.end, "rightUpperLeg").z) /
      2;
    if (Math.abs(stop(one) - stop(two)) > 0.001)
      complaints.push(
        `the two seeds stop ${(Math.abs(stop(one) - stop(two)) * 1000).toFixed(1)} mm apart along the way, within 1 mm expected`,
      );
  }
  TestValidator.equals("step timing moves when, never where", complaints, []);
}
