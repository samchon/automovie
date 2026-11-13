import { createAutoMovieRandom, deriveAutoMovieSeed } from "@automovie/engine";
import {
  HumanBreath,
  HumanGaze,
  gestureSignal,
  gestureStroke,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Breathing keeps adult resting rates and continuous phase, gaze splits a
 * direction over the eyes, head and trunk in recruitment order, and gesture
 * strokes start and end at rest.
 *
 * Scenarios:
 * 1. Over 200 seeds every resting rate lies in the adult band of 12 to 20 a
 *    minute (Cretikos et al. 2008) and their mean is within three standard
 *    errors of the truncated normal's mean.
 * 2. The lung volume is zero at each cycle boundary and positive inside;
 *    over 20,000 cycles the share of sighs is the period over 300 s within
 *    20 % (about twelve sighs an hour, Ramirez 2014).
 * 3. An exertion bout raises the rate before its end and the rate recovers
 *    to rest after its recovery time; the phase is continuous across the
 *    bout's end within the change one millisecond of breathing makes.
 * 4. Two evaluations with the same seed are identical.
 * 5. Gaze split: 10 degrees stays on the eyes; 40 degrees leaves 15 on the
 *    eyes and 25 on the head; 100 degrees gives the head its 60 and the trunk
 *    the remaining 25; recruiting the head only leaves the excess on the
 *    eyes; `eyes` leaves everything on the eyes; every split sums to the
 *    direction, and mirroring the yaw mirrors the split.
 * 6. Saccade durations follow `2.2 A + 21` ms and head turns lengthen with
 *    amplitude.
 * 7. A gesture stroke's oscillation is zero at both ends and continuous,
 *    and every gesture names its hands.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the rate draw, the breathing state, the split, the timings and the stroke signal; an out-of-band rate, a phase jump, a lost sigh rate, a split that does not sum, a broken recruitment order or a stroke that jumps fails.
 * @evidence contracts/development/testing.md#independent-expectations The rate band, sigh rate, recruitment thresholds and main sequence are the cited studies' values; sums, mirror symmetry and continuity are exact properties computed here.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers seeds, cycle boundaries, rest and exertion, before and after recovery, small, middle and large gaze shifts in every recruitment mode and both directions; the posed gaze accuracy is owned by the local look test.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 7 scenarios and what each pins.
 */
export function test_motion_everyday_breath_gaze(): void {
  const stream = (k: string) =>
    createAutoMovieRandom(deriveAutoMovieSeed("breath", k));
  const rates: number[] = Array.from(
    { length: 200 },
    (_: unknown, i: number): number =>
      HumanBreath.restingRate(stream(`rate${i}`)),
  );
  TestValidator.predicate(
    "rates in band",
    rates.every((r: number): boolean => r >= 12 && r <= 20),
  );
  const mean: number =
    rates.reduce((a: number, b: number): number => a + b, 0) / rates.length;

  // N(15, 2) truncated to [12, 20] has mean 15 + 2 (phi(-1.5) - phi(2.5)) / (Phi(2.5) - Phi(-1.5)) = 15.24; 0.4 is three standard errors of 200 draws.
  TestValidator.predicate(
    `rate mean ${mean.toFixed(2)} near 15.24`,
    Math.abs(mean - 15.24) < 0.4,
  );

  const sigh = stream("sigh");
  const rate: number = 15;
  const atCycle = (n: number, f: number) =>
    HumanBreath.state(((n + f) * 60) / rate, rate, [], 0, sigh);
  TestValidator.predicate(
    "zero at cycle boundaries",
    [0, 1, 7, 40].every(
      (n: number): boolean => Math.abs(atCycle(n, 0).volume) < 1e-9,
    ),
  );
  TestValidator.predicate(
    "positive inside a cycle",
    [0.2, 0.42, 0.7].every((f: number): boolean => atCycle(3, f).volume > 0),
  );
  let sighs: number = 0;
  const cycles: number = 20000;
  for (let n: number = 0; n < cycles; n++)
    if (atCycle(n, HumanBreath.INSPIRATION).volume > 1.5) sighs++;
  const expected: number = (cycles * 60) / rate / HumanBreath.SIGH_INTERVAL;
  TestValidator.predicate(
    `sigh share ${sighs} near ${expected.toFixed(0)}`,
    Math.abs(sighs / expected - 1) < 0.2,
  );

  const bout: HumanBreath.IExertion = { at: 30, level: 1, recovery: 60 };
  const before = HumanBreath.state(29, rate, [bout], 0, sigh);
  const after = HumanBreath.state(91, rate, [bout], 0, sigh);
  TestValidator.predicate(
    "exertion raises the rate",
    Math.abs(before.rate - HumanBreath.EXERTION_RATE) < 1e-9,
  );
  TestValidator.predicate(
    "recovered after the recovery",
    Math.abs(after.rate - rate) < 1e-9,
  );
  const a = HumanBreath.state(30 - 1e-6, rate, [bout], 0, sigh);
  const b = HumanBreath.state(30 + 1e-6, rate, [bout], 0, sigh);
  TestValidator.predicate(
    "phase continuous at the bout's end",
    Math.abs(b.phase - a.phase) < (HumanBreath.EXERTION_RATE / 60) * 1e-3,
  );
  TestValidator.predicate(
    "deterministic",
    HumanBreath.state(12.3, rate, [bout], 0.4, sigh).volume ===
      HumanBreath.state(12.3, rate, [bout], 0.4, sigh).volume,
  );

  const sum = (s: HumanGaze.ISplit): number =>
    s.eyes.yaw + s.head.yaw + s.trunk;
  const small = HumanGaze.split(10, 0);
  TestValidator.predicate(
    "small shift on the eyes",
    small.eyes.yaw === 10 && small.head.yaw === 0 && small.trunk === 0,
  );
  const middle = HumanGaze.split(40, 0);
  TestValidator.predicate(
    "middle shift recruits the head",
    middle.eyes.yaw === 15 && middle.head.yaw === 25 && middle.trunk === 0,
  );
  const large = HumanGaze.split(100, 0);
  TestValidator.predicate(
    "large shift recruits the trunk",
    large.eyes.yaw === 15 && large.head.yaw === 60 && large.trunk === 25,
  );
  const headOnly = HumanGaze.split(100, 0, "head");
  TestValidator.predicate(
    "head only leaves the excess on the eyes",
    headOnly.trunk === 0 &&
      headOnly.head.yaw === 60 &&
      headOnly.eyes.yaw === 40,
  );
  const eyesOnly = HumanGaze.split(50, -20, "eyes");
  TestValidator.predicate(
    "eyes only",
    eyesOnly.eyes.yaw === 50 &&
      eyesOnly.eyes.pitch === -20 &&
      eyesOnly.head.yaw === 0,
  );
  for (const y of [5, 30, 75, 130, -60])
    for (const mode of ["auto", "head", "trunk", "eyes"] as const) {
      const s = HumanGaze.split(y, 25, mode);
      const m = HumanGaze.split(-y, 25, mode);
      TestValidator.predicate(
        "split sums to the direction",
        Math.abs(sum(s) - y) < 1e-12 &&
          Math.abs(s.eyes.pitch + s.head.pitch - 25) < 1e-12,
      );
      TestValidator.predicate(
        "split mirrors",
        Math.abs(m.eyes.yaw + s.eyes.yaw) < 1e-12 &&
          Math.abs(m.head.yaw + s.head.yaw) < 1e-12 &&
          Math.abs(m.trunk + s.trunk) < 1e-12,
      );
    }
  TestValidator.predicate(
    "main sequence",
    Math.abs(HumanGaze.saccade(10) - 0.043) < 1e-12 &&
      Math.abs(HumanGaze.saccade(-30) - 0.087) < 1e-12,
  );
  TestValidator.predicate(
    "head turns lengthen with amplitude",
    HumanGaze.turn(60) > HumanGaze.turn(20) &&
      HumanGaze.turn(20) > HumanGaze.turn(0),
  );

  TestValidator.predicate(
    "stroke ends at rest",
    gestureSignal.oscillation(0, 3) === 0 &&
      gestureSignal.oscillation(1, 3) === 0,
  );
  let jump: number = 0;
  for (let i: number = 1; i <= 1000; i++)
    jump = Math.max(
      jump,
      Math.abs(
        gestureSignal.oscillation(i / 1000, 3) -
          gestureSignal.oscillation((i - 1) / 1000, 3),
      ),
    );
  TestValidator.predicate(
    `stroke continuous (${jump.toFixed(4)})`,
    jump < 0.02,
  );
  for (const kind of Object.keys(gestureStroke.RHYTHM) as gestureStroke.Kind[])
    TestValidator.predicate(
      `${kind} names its hands`,
      ["one", "both", "none"].includes(gestureStroke.HANDS[kind]),
    );
}
