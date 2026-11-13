import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSocial,
  type IHumanBody,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Four people toast at one point (#3350: two or more held glasses meet at
 * one shared point): `HumanSocial.toastOfFour` with a stated point brings
 * every role's hand to it.
 *
 * Four average men stand on a circle of 0.45 m about the point, each facing
 * it, and mime the toast with their fists, so the test needs no glass; the
 * point is at their chest height. Held glasses at a pair's own point are
 * `test_human_motion_social_toast`'s.
 *
 * Scenarios:
 * 1. The toast of four plans.
 * 2. At each role's own `meet`, the fist's surface lies within 15 mm of the
 *    stated point (#3350's bound for a shared contact at its instant).
 * 3. The two roles of a pair meet within one 24 Hz frame of each other.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Joins four performers through the public mutual join and reads displayed hands; a pair that meets at its own midpoint, a hand short of the point or a pair out of time fails.
 * @evidence contracts/development/testing.md#independent-expectations The 15 mm and the one frame are acceptance lines of #3350; the point is the test's own.
 * @evidence contracts/development/testing.md#distinguishing-cases Four roles at one point, against the pair at its own point in the sibling test.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds one four-person performance; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage, why the toast is mimed and the 3 scenarios with their bounds.
 */
export function test_human_motion_social_toast_four(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const at: IAutoMovieVector3 = { x: 0, y: body.measure.chestHeight, z: 0 };
  const cast = [
    ["a", "host", { x: 0, y: 0, z: -0.45 }, 0],
    ["b", "guest", { x: 0, y: 0, z: 0.45 }, 180],
    ["c", "third", { x: -0.45, y: 0, z: 0 }, 90],
    ["d", "fourth", { x: 0.45, y: 0, z: 0 }, -90],
  ] as const;
  const complaints: string[] = [];

  // 1. The toast plans.
  let performance: HumanPerformance;
  try {
    performance = new HumanPerformance({
      seed: "four",
      laws: [HumanSocial.fistBump],
      performers: cast.map(([subject, , place, yaw]) => ({
        subject,
        body,
        at: place,
        yaw,
        proficiency: { level: "trained" as const },
      })),
      composition: HumanChain.mutual(
        HumanSocial.toastOfFour,
        {
          host: HumanChain.subject("a").stand({ seconds: 0.3 }),
          guest: HumanChain.subject("b").stand({ seconds: 0.3 }),
          third: HumanChain.subject("c").stand({ seconds: 0.3 }),
          fourth: HumanChain.subject("d").stand({ seconds: 0.3 }),
        },
        { at },
      ).node,
    });
  } catch (error) {
    TestValidator.equals(
      "a toast of four at one point plans",
      error instanceof Error ? error.message : String(error),
      "",
    );
    return;
  }

  // 2. Every fist at the point at its own meet.
  const meets: Record<string, number> = {};
  for (const [subject, role] of cast) {
    const placed: HumanSegment.ISegment = performance.segments(subject)[1]!;
    const meet: number =
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === "meet")?.share ??
        NaN) *
        placed.plan.duration;
    meets[subject] = meet;
    const fist: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
      body,
      performance.bones(subject, meet),
      "right",
      touch.EFFECTORS.fist,
    );
    const off: number = Math.hypot(fist.x - at.x, fist.y - at.y, fist.z - at.z);
    if (!(off <= 0.015))
      complaints.push(
        `${role}: the fist lies ${(off * 1000).toFixed(0)} mm from the shared point at meet, within 15 mm expected`,
      );
  }

  // 3. A pair meets together.
  for (const [one, other] of [
    ["a", "b"],
    ["c", "d"],
  ] as const)
    if (!(Math.abs(meets[one]! - meets[other]!) <= 1 / 24))
      complaints.push(
        `${one} and ${other} meet at ${meets[one]!.toFixed(3)} and ${meets[other]!.toFixed(3)} s, one 24 Hz frame apart at most expected`,
      );
  TestValidator.equals("a toast of four at one point", complaints, []);
}
