import { AutoMovieMotionClock } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";

/**
 * The clock's two fixed instants, the phrase's standard instants, a
 * repeated span and a stretched clock (`AutoMovieMotionClock`).
 *
 * Every clock has `start` at 0 and `end` at its duration. A phrase's
 * standard instants are BML 1.0's synchronisation points in time order. A
 * repetition numbers each copy of a period's phases from 1 and keeps their
 * lengths. A stretch multiplies each span, named by the instant that opens
 * it, by its own factor, so an instant's new time is the sum of the
 * stretched spans before it.
 *
 * The phrase used has lengths 0.2, 0.1, 0.3, 0.15, 0.05 and 0.4 s, so its
 * instants are at 0.2, 0.3, 0.6, 0.75 and 0.8 s and it lasts 1.2 s.
 * Stretching the span `start` opens by 2 and the one `stroke` opens by 3
 * moves `ready` to 0.4, `strokeStart` to 0.5, `stroke` to 0.8, `strokeEnd`
 * to 1.25, `relax` to 1.3 and the end to 1.7 s.
 *
 * Scenarios:
 * 1. `START` is at 0 and `END` at the duration of a phrase and of a
 *    sequence.
 * 2. `PHRASE` names `ready`, `strokeStart`, `stroke`, `strokeEnd` and
 *    `relax`, which a phrase places in that order at the running sums.
 * 3. `repeat` of `down` 0.1 s and `up` 0.2 s twice gives `down1`, `up1`,
 *    `down2`, `up2` with their lengths, lays out as a 0.6 s sequence, and
 *    refuses a count of 0 or 1.5.
 * 4. `stretch` gives the times worked out above, keeps every name and
 *    refuses a factor of 0 or less.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds real clocks and reads their instants; a fixed instant off its place, a phrase out of order, a repetition misnamed or a stretch applied to the wrong span fails.
 * @evidence contracts/development/testing.md#independent-expectations Every time is a running sum worked out in the comment.
 * @evidence contracts/development/testing.md#distinguishing-cases A phrase and a sequence; one and two repetitions and two bad counts; a factor per span, a unit factor and two bad factors.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States each rule, the worked times and the 4 scenarios.
 */
export function test_motion_compose_clock_spans(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;
  const phrase: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
    prepare: 0.2,
    wait: 0.1,
    attack: 0.3,
    follow: 0.15,
    hold: 0.05,
    retract: 0.4,
  });

  // 1. The fixed instants.
  const sequence: AutoMovieMotionClock.IClock = AutoMovieMotionClock.sequence([
    { name: "lift", seconds: 0.3 },
    { name: "drop", seconds: 0.45 },
  ]);
  complaints.check(
    "start is at 0 and end at the duration",
    phrase.at(AutoMovieMotionClock.START) === 0 &&
      close(phrase.at(AutoMovieMotionClock.END), 1.2) &&
      close(phrase.duration, 1.2) &&
      sequence.at(AutoMovieMotionClock.START) === 0 &&
      close(sequence.at(AutoMovieMotionClock.END), 0.75),
  );

  // 2. The phrase's instants.
  complaints.equals("the standard instants", AutoMovieMotionClock.PHRASE, [
    "ready",
    "strokeStart",
    "stroke",
    "strokeEnd",
    "relax",
  ]);
  const expected: number[] = [0.2, 0.3, 0.6, 0.75, 0.8];
  AutoMovieMotionClock.PHRASE.forEach((name: string, i: number): void =>
    complaints.check(
      `${name} is at ${expected[i]} s, not ${phrase.at(name)}`,
      close(phrase.at(name), expected[i]!),
    ),
  );

  // 3. Repetition.
  const span: AutoMovieMotionClock.IPhase[] = [
    { name: "down", seconds: 0.1 },
    { name: "up", seconds: 0.2 },
  ];
  complaints.equals("one repetition", AutoMovieMotionClock.repeat(span, 1), [
    { name: "down1", seconds: 0.1 },
    { name: "up1", seconds: 0.2 },
  ]);
  const twice: AutoMovieMotionClock.IPhase[] = AutoMovieMotionClock.repeat(
    span,
    2,
  );
  complaints.equals("two repetitions", twice, [
    { name: "down1", seconds: 0.1 },
    { name: "up1", seconds: 0.2 },
    { name: "down2", seconds: 0.1 },
    { name: "up2", seconds: 0.2 },
  ]);
  const laid: AutoMovieMotionClock.IClock =
    AutoMovieMotionClock.sequence(twice);
  complaints.check(
    "two repetitions lay out as a 0.6 s sequence",
    close(laid.duration, 0.6) &&
      close(laid.at("down2"), 0.3) &&
      close(laid.at("up2"), 0.4),
  );
  complaints.refuses("a count of 0", () =>
    AutoMovieMotionClock.repeat(span, 0),
  );
  complaints.refuses("a count of 1.5", () =>
    AutoMovieMotionClock.repeat(span, 1.5),
  );

  // 4. Stretch.
  const stretched: AutoMovieMotionClock.IClock = AutoMovieMotionClock.stretch(
    phrase,
    (opening: string): number =>
      opening === "start" ? 2 : opening === "stroke" ? 3 : 1,
  );
  const times: Record<string, number> = {
    ready: 0.4,
    strokeStart: 0.5,
    stroke: 0.8,
    strokeEnd: 1.25,
    relax: 1.3,
  };
  for (const [name, seconds] of Object.entries(times))
    complaints.check(
      `stretched ${name} is at ${seconds} s, not ${stretched.at(name)}`,
      close(stretched.at(name), seconds),
    );
  complaints.check(
    `the stretched clock lasts 1.7 s, not ${stretched.duration}`,
    close(stretched.duration, 1.7),
  );
  complaints.equals(
    "a stretch keeps every name",
    stretched.instants.map(
      (i: AutoMovieMotionClock.IInstant): string => i.name,
    ),
    phrase.instants.map((i: AutoMovieMotionClock.IInstant): string => i.name),
  );
  complaints.refuses("a factor of 0", () =>
    AutoMovieMotionClock.stretch(phrase, (): number => 0),
  );
  complaints.refuses("a negative factor", () =>
    AutoMovieMotionClock.stretch(phrase, (o: string): number =>
      o === "relax" ? -1 : 1,
    ),
  );
  complaints.assert("every span is laid out as documented");
}
