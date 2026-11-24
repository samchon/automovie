import { integrateAirborneRotation } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAcrobatics,
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * Prepared sport playback samples the same posture as the authored local clock.
 *
 * Scenarios:
 * 1. Seek a standing workout and a workout with laid hands.
 * 2. Seek the same phase of a travelling stroke in different cycles and at the finish.
 * 3. Seek inside a wheel and on its ground, flight and landing boundaries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the prepared families and their distinct time scopes.
 * @evidence contracts/development/testing.md#behavioral-verification Compares complete displayed poses against a second performance with a distinct public action reader.
 * @evidence contracts/development/testing.md#independent-expectations The ordinary action reader independently selects the same event branch and provides the expected posture.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes exact event seconds, nearby and interior seconds and reverse seeks.
 * @evidence contracts/development/testing.md#execution-ownership Constructs separate performances and uses public reader replacement in the reference to select the ordinary route.
 */
export function test_motion_ball_sports_sport_native_playback(): void {
  const body: ReturnType<typeof motionHumanBody> = motionHumanBody("m-average");
  const entry: ReturnType<typeof HumanChain.subject> = HumanChain.subject("a");
  const cases = [
    {
      name: "backSquat",
      node: entry.registered("backSquat", { count: 3 }).node,
    },
    { name: "pushUp", node: entry.registered("pushUp", { count: 3 }).node },
    {
      name: "breaststroke",
      node: entry.swim({ kind: "breaststroke", count: 3 }).node,
    },
    {
      name: "cartwheel",
      node: entry.registered("cartwheel", { to: "left" }).node,
    },
    { name: "roundOffLeft", node: entry.registered("roundOffLeft", {}).node },
    {
      name: "frontHandspring",
      node: entry.registered("frontHandspring", {}).node,
    },
  ];
  for (const { name, node } of cases) {
    const make = (): HumanPerformance =>
      new HumanPerformance(
        {
          seed: "sport-native-playback",
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          laws: [
            AutoMovieMotionHumanWorkout.HumanSportWorkout.backSquat,
            AutoMovieMotionHumanWorkout.HumanSportWorkout.pushUp,
            AutoMovieMotionHumanAcrobatics.cartwheel,
            AutoMovieMotionHumanAcrobatics.HumanGymnastics.roundOffLeft,
            AutoMovieMotionHumanAcrobatics.HumanGymnastics.frontHandspring,
          ],
          composition: node,
        },
        integrateAirborneRotation.observe(),
      );
    const film: HumanPerformance = make();
    const reference: HumanPerformance = make();
    const segment: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
    const ordinary: IAutoMovieMotionHumanSegment = reference.segments("a")[0]!;
    const original: IAutoMovieMotionHumanActionPlan["posture"] =
      ordinary.plan.posture;
    ordinary.plan.posture = (...args: Parameters<typeof original>) =>
      Reflect.apply(original, ordinary.plan, args);
    const { duration, events }: IAutoMovieMotionHumanActionPlan = segment.plan;
    const samples: number[] = [duration, 0, duration * 0.4, duration / 11];
    for (const event of events) {
      const t: number = event.share * duration;
      samples.push(Math.min(duration, t + 1e-9), t, Math.max(0, t - 1e-9));
    }
    for (const seconds of samples) {
      const actual: IAutoMoviePose = film.pose("a", segment.start + seconds);
      const expected: IAutoMoviePose = reference.pose(
        "a",
        ordinary.start + seconds,
      );
      TestValidator.predicate(
        `${name} displayed pose at ${seconds} seconds`,
        equivalent(actual, expected),
      );
    }
  }
}

/** Compare authored records while allowing arithmetic roundoff in scalar fields. */
function equivalent(actual: unknown, expected: unknown): boolean {
  if (typeof actual === "number" && typeof expected === "number")
    return nclose(actual, expected, 1e-9);
  if (actual === expected) return true;
  if (
    typeof actual !== "object" ||
    actual === null ||
    typeof expected !== "object" ||
    expected === null
  )
    return false;
  const left: Record<string, unknown> = actual as Record<string, unknown>;
  const right: Record<string, unknown> = expected as Record<string, unknown>;
  const keys: string[] = Object.keys(left);
  return (
    keys.length === Object.keys(right).length &&
    keys.every(
      (key: string): boolean =>
        Object.hasOwn(right, key) && equivalent(left[key], right[key]),
    )
  );
}
