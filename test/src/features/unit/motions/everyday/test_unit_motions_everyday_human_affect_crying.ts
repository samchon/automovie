import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { HumanAffect, HumanRefusal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few minimum-jerk products, degrees. */
const ROUNDING: number = 1e-9;

/** The sampling step of the inspiration peaks, seconds. */
const STEP: number = 0.001;

/**
 * A sob's interval between inspirations at intensity 1 and its ±30 % seeded
 * range, seconds.
 */
const SOB: readonly [number, number] = [0.5 * 0.7, 0.5 * 1.3];

/** The 12 Hz Nyquist limit of 24 Hz film, seconds. */
const NYQUIST: number = 1 / 12;

/**
 * The seconds of a 4 s sob's steady part, between its 8 % ramp in and its 20 %
 * ramp out, at which the shoulder lift peaks.
 */
function peaks(intensity: number, seed: string): number[] {
  const lift = (t: number): number =>
    HumanAffect.angles("sob", t, 4, intensity, seed).leftShoulder![1];
  const found: number[] = [];
  for (let t: number = 0.32 + STEP; t < 3.2 - STEP; t += STEP)
    if (lift(t) > lift(t - STEP) && lift(t) >= lift(t + STEP)) found.push(t);
  return found;
}

/**
 * `HumanAffect.angles` of the crying displays: a sob flexes the chest 6, the
 * lumbar spine 4 and the head 10 degrees under a seeded train of inspirations,
 * each lifting the shoulders 6 and extending the chest 4, the first a third of
 * the 0.5 s interval in; a weep lowers the head 12 and flexes the chest 4 over
 * a 2.5 s shoulder heave of 2, with seeded sniffs lifting the head 3 and the
 * shoulders 2; a gasp's one inspiration extends the head 12 and the chest 6 and
 * lifts the shoulders 8, peaking 0.25 s in. A sob's or weep's timing is its
 * seed's, the same in every read.
 *
 * Scenarios:
 *
 * 1. Inside a 4 s sob's steady part, at every read the head is 10 and the spine 4,
 *    and the chest and the shoulder lift move together: chest + 2/3 shoulder =
 *    6; the shoulders are still before the first inspiration, at 0.15 s.
 * 2. Inside a 10 s weep's steady part the head is 12 less 3/2 of the shoulders'
 *    lift beyond the slow heave `2 (0.5 - 0.5 cos(2 pi t / 2.5))`.
 * 3. A 1.5 s gasp at 0.25 s extends the head 12, the chest 6 and lifts each
 *    shoulder 8.
 * 4. In the steady part the shoulder lift peaks at intervals within ±30 % of 0.5
 *    s, never closer than 1/12 s, not all equal; another seed moves the peaks
 *    and intensity 2 gives more of them.
 * 5. The same seed reads the same sob twice; a sneeze too short for its burst is
 *    refused by the layer on `seconds`.
 */
export function test_unit_motions_everyday_human_affect_crying(): void {
  const sob: (
    t: number,
    seed?: string,
  ) => IAutoMovieMotionHumanPosture["joints"] = (
    t: number,
    seed: string = "tears",
  ): IAutoMovieMotionHumanPosture["joints"] =>
    HumanAffect.angles("sob", t, 4, 1, seed);
  TestValidator.predicate(
    "a sob",
    [1, 1.3, 1.7, 2.1, 2.6].every((t: number): boolean => {
      const j: IAutoMovieMotionHumanPosture["joints"] = sob(t);
      return (
        nclose(j.head![0], 10, ROUNDING) &&
        nclose(j.spine![0], 4, ROUNDING) &&
        nclose(j.chest![0] + (2 / 3) * j.leftShoulder![1], 6, ROUNDING)
      );
    }) && sob(0.15).leftShoulder![1] === 0,
  );
  TestValidator.predicate(
    "a weep",
    [3, 4.4, 5.9].every((t: number): boolean => {
      const j: IAutoMovieMotionHumanPosture["joints"] = HumanAffect.angles(
        "weep",
        t,
        10,
        1,
        "tears",
      );
      const slow: number = 2 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 2.5));
      const sniff: number = (j.leftShoulder![1] - slow) / 2;
      return (
        nclose(j.head![0], 12 - 3 * sniff, ROUNDING) &&
        nclose(j.chest![0], 4, ROUNDING)
      );
    }),
  );
  const gasp: IAutoMovieMotionHumanPosture["joints"] = HumanAffect.angles(
    "gasp",
    0.25,
    1.5,
  );
  TestValidator.predicate(
    "a gasp",
    nclose(gasp.head![0], -12, ROUNDING) &&
      nclose(gasp.chest![0], -6, ROUNDING) &&
      nclose(gasp.leftShoulder![1], 8, ROUNDING) &&
      nclose(gasp.rightShoulder![1], 8, ROUNDING),
  );
  TestValidator.equals("replayed", sob(1.7), sob(1.7));
  const lifts: number[] = peaks(1, "a");
  const gaps: number[] = lifts
    .slice(1)
    .map((t: number, i: number): number => t - lifts[i]!);
  TestValidator.predicate(
    "seeded intervals",
    gaps.length >= 3 &&
      gaps.every(
        (gap: number): boolean =>
          gap >= SOB[0] - 2 * STEP && gap <= SOB[1] + 2 * STEP && gap > NYQUIST,
      ) &&
      Math.max(...gaps) - Math.min(...gaps) > 4 * STEP,
  );
  TestValidator.predicate(
    "another seed, a stronger sob",
    peaks(1, "b").join() !== lifts.join() &&
      peaks(2, "a").length > lifts.length,
  );
  let axis: string | undefined;
  try {
    HumanAffect.layer([{ kind: "sneeze", at: 0, duration: 0.2 }]);
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) axis = error.axis;
  }
  TestValidator.equals("a short sneeze", axis, "seconds");
}
