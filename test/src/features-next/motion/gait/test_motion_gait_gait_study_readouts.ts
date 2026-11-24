import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSignature,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { AutoMovieMotionManner } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * The steady walk has human speed, stride length and vertical centre excursion.
 *
 * Scenarios:
 * 1. Measure neutral and weary walking in the middle of one straight path for both original body sizes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification The steady walk has human speed, stride length and vertical centre excursion. Reads lengths in hip heights from the public walking gait.
 * @evidence contracts/development/testing.md#independent-expectations Bohannon’s steady walking speed band is 1.27–1.46 m/s; the walking centre rises and falls 4–5 cm. Montepare et al. predict shorter, slower weary steps. Inverted-pendulum exchange gives the higher, slower centre at midstance. The fourth power of two is sixteen. The reach ceiling is the horizontal separation of two straight legs at the limiting hip angles.
 * @evidence contracts/development/testing.md#distinguishing-cases Body size changes dynamic similarity; weary and normal trials share a seed and path. Two low speeds distinguish the exponent and a high speed reaches the geometric limit.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory. Calls one gait directly.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation. Specifies the dimensionless growth and saturation.
 */
export function test_motion_gait_gait_study_readouts(): void {
  walkingSimilarity();
  const findings: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const read = (weary: boolean): readonly [number, number] => {
      const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
        seed: "recompose-travel",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").walk({
          to: { x: 0, y: 0, z: 6 },
          ...(weary ? { manner: AutoMovieMotionManner.PRESETS.weary } : {}),
        }).node,
      });
      const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
        film,
        "a",
        body,
        0,
      );
      const from: number = film.duration * 0.25,
        to: number = film.duration * 0.85;
      const z = (t: number): number =>
        HumanSignature.joint(reader, t, "hips").z;
      const gait = HumanSignature.gait(reader, from, to);
      const strikes: number[] = gait.strikes.map((s) => s.seconds);
      const step: number =
        (z(strikes[strikes.length - 1]!) - z(strikes[0]!)) /
        (strikes.length - 1);
      const speed: number = (z(to) - z(from)) / (to - from);
      if (!weary) {
        if (!(speed >= 1.27 && speed <= 1.46))
          findings.push(`${name} steady speed ${speed} m/s`);
        const y: number[] = HumanSignature.times(from, to, 120).map(
          (t) => HumanSignature.centre(reader, t).y,
        );
        const range: number = Math.max(...y) - Math.min(...y);
        if (!(range >= 0.04 && range <= 0.05))
          findings.push(`${name} centre excursion ${range} m`);
        const forward = (t: number): number =>
          (HumanSignature.centre(reader, t + 1 / 240).z -
            HumanSignature.centre(reader, t - 1 / 240).z) *
          120;
        for (let i = 1; i < strikes.length; i++) {
          const strike: number = strikes[i - 1]!,
            mid: number = (strike + strikes[i]!) / 2;
          if (
            !(
              forward(mid) < forward(strike) &&
              HumanSignature.centre(reader, mid).y >
                HumanSignature.centre(reader, strike).y
            )
          )
            findings.push(`${name} midstance exchange at ${mid}s`);
        }
      }
      return [speed, step];
    };
    const neutral = read(false),
      weary = read(true);
    if (!(weary[0] < neutral[0] && weary[1] < neutral[1]))
      findings.push(`${name} weary speed/step ${weary} vs ${neutral}`);
  }
  TestValidator.equals(
    "gait study intervals and manner direction",
    findings,
    [],
  );
}
/**
 * Dimensionless walking steps grow by the fourth root of Froude number until hip reach limits them.
 *
 * Scenarios:
 * 1. Sixteen times the Froude number doubles a short step.
 * 2. Above the anatomical limit the step holds its maximum.
 *
 */
function walkingSimilarity(): void {
  const slow: number = 1 / 256;
  const step = AutoMovieMotionHumanGait.walk.walking(slow).step;
  TestValidator.predicate(
    "fourth-root scaling",
    nclose(step(16 * slow), 2 * step(slow)),
  );
  TestValidator.predicate(
    "reach saturation",
    nclose(step(1), AutoMovieMotionHumanGait.walk.longestStep()) &&
      step(1) > step(16 * slow),
  );
}
