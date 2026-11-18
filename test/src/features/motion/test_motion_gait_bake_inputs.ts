import { gaitMotion } from "@automovie/engine";
import type { IAutoMovieGait } from "@automovie/interface";

import { motionComplaints } from "../internal/motionComplaints";
import { nclose } from "../internal/predicates";

/**
 * The gait baker's cycle interval has a finite positive period and a positive
 * integer number of parts. Its smallest population consists of both endpoints.
 *
 * Scenarios:
 * 1. Reject the existing non-finite, zero and negative clock inputs and the
 *    fractional sample count, each with the other clock input valid.
 * 2. One interval starts at zero, emits two keyframes and ends at its authored
 *    period, for both the one-second and quarter-second cycles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes each clock constraint and the two endpoint cases.
 * @evidence contracts/development/testing.md#behavioral-verification Invokes the actual gait baker with the malformed inputs and checks length, duration and endpoint times for the accepted boundaries.
 * @evidence contracts/development/testing.md#independent-expectations An interval has endpoints at zero and the authored period. Uses the same absolute tolerance and refusal semantics.
 * @evidence contracts/development/testing.md#distinguishing-cases Changes one rejected input at a time and distinguishes the shortest supported population from invalid counts and the shorter period from one second.
 * @evidence contracts/development/testing.md#execution-ownership One engine unit runs synchronously and stages no scene.
 */
export function test_motion_gait_bake_inputs(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const gait: IAutoMovieGait = {
    name: "walk",
    period: 1,
    limbs: [
      { bone: "leftUpperLeg", phase: 0, duty: 0.5, amplitude: 30 },
      { bone: "rightUpperLeg", phase: 0.5, duty: 0.5, amplitude: 30 },
    ],
  };
  for (const samples of [Number.NaN, 1.5, 0, -1])
    checks.refuses(`samples ${samples}`, () =>
      gaitMotion("invalid", "sk", gait, samples),
    );
  for (const period of [Number.NaN, Infinity, 0, -1])
    checks.refuses(`period ${period}`, () =>
      gaitMotion("invalid", "sk", { ...gait, period }, 1),
    );

  for (const period of [gait.period, gait.period / 4]) {
    const clip: ReturnType<typeof gaitMotion> = gaitMotion(
      "boundary",
      "sk",
      { ...gait, period },
      1,
    );
    checks.equals(`period ${period}, one interval`, clip.keyframes.length, 2);
    checks.check(
      `period ${period}, duration ${clip.duration}`,
      nclose(clip.duration, period),
    );
    const start: number = clip.keyframes[0]?.time ?? NaN;
    const end: number = clip.keyframes[1]?.time ?? NaN;
    checks.check(`period ${period}, opening time ${start}`, nclose(start, 0));
    checks.check(`period ${period}, closing time ${end}`, nclose(end, period));
  }
  checks.assert("gait bake admits and samples its authored cycle interval");
}
