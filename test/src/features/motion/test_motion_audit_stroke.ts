import { AutoMovieMotionHumanAuditStroke } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The stroke audit counts the swings a movement really shows and reads how
 * far each goes, so a motion that repeats fewer or more times than it was
 * asked, or that fades, is told apart from the asked one.
 *
 * Each scalar is written by hand, in metres over seconds, and read at 120
 * instants per second with a prominence of 10 mm unless stated.
 *
 * Scenarios:
 * 1. Three periods of a 40 mm sine over 3 s read three peaks of 40 mm at
 *    0.25, 1.25 and 2.25 s and three troughs of -40 mm at 0.75, 1.75 and
 *    2.75 s.
 * 2. A movement asked three times that swings twice and then holds reads
 *    two peaks: the missing repetition is seen.
 * 3. A 2 mm ripple alone reads no turning point, and laid on the three
 *    swings it adds none.
 * 4. A steady climb reads none: the ends of a span are not turning points.
 * 5. A rise to a plateau held for a second and a fall reads one peak, at
 *    the plateau's first instant.
 * 6. Three strokes of 50, 30 and 20 mm read each height at its own instant
 *    and the two touches of zero between them.
 * 7. Read from 1 s on, the three swings show the two that remain.
 * 8. A prominence of zero, a rate of zero and a reversed span are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public reading on written scalars; a count taken from a plan, an end counted as a swing, a ripple counted, a plateau counted twice or a height not reported fails.
 * @evidence contracts/development/testing.md#independent-expectations Every instant and height is the closed form of the scalar the test wrote: a sine's quarter periods, a triangle's apex, a trapezoid's corner.
 * @evidence contracts/development/testing.md#distinguishing-cases The asked count, a short count, noise alone and on a signal, a monotone span, a plateau, unequal strokes, a later span and three bad inputs.
 * @evidence contracts/development/testing.md#execution-ownership In memory on closed-form scalars; nothing is prepared.
 * @evidence contracts/development/common.md#meaningful-documentation States the scalars, the reading's settings and the 8 scenarios with their numbers.
 */
export function test_motion_audit_stroke(): void {
  type Result = AutoMovieMotionHumanAuditStroke.IResult;
  type Extreme = AutoMovieMotionHumanAuditStroke.IExtreme;
  const read = (
    signal: (seconds: number) => number,
    from: number = 0,
    to: number = 3,
    prominence: number = 0.01,
    rate: number = 120,
  ): Result =>
    AutoMovieMotionHumanAuditStroke.measure(signal, from, to, prominence, rate);
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;
  const matches = (got: Extreme[], expected: [number, number][]): boolean =>
    got.length === expected.length &&
    got.every(
      (e: Extreme, i: number): boolean =>
        near(e.seconds, expected[i]![0]) && near(e.value, expected[i]![1]),
    );
  const show = (result: Result): string => JSON.stringify(result);
  const sine = (t: number): number => 0.04 * Math.sin(2 * Math.PI * t);

  // 1. The asked count.
  const three: Result = read(sine);
  TestValidator.predicate(
    `three periods read three peaks and three troughs, got ${show(three)}`,
    matches(three.peaks, [
      [0.25, 0.04],
      [1.25, 0.04],
      [2.25, 0.04],
    ]) &&
      matches(three.troughs, [
        [0.75, -0.04],
        [1.75, -0.04],
        [2.75, -0.04],
      ]),
  );

  // 2. A short count.
  const short: Result = read((t: number): number => (t < 2 ? sine(t) : 0));
  TestValidator.predicate(
    `two swings and a hold read two peaks, got ${show(short)}`,
    matches(short.peaks, [
      [0.25, 0.04],
      [1.25, 0.04],
    ]) &&
      matches(short.troughs, [
        [0.75, -0.04],
        [1.75, -0.04],
      ]),
  );

  // 3. A ripple.
  const ripple = (t: number): number => 0.002 * Math.sin(40 * Math.PI * t);
  const still: Result = read(ripple);
  TestValidator.predicate(
    `a 2 mm ripple is no swing, got ${show(still)}`,
    still.peaks.length === 0 && still.troughs.length === 0,
  );
  const rough: Result = read((t: number): number => sine(t) + ripple(t));
  TestValidator.predicate(
    `a ripple on three swings adds none, got ${show(rough)}`,
    rough.peaks.length === 3 && rough.troughs.length === 3,
  );

  // 4. A monotone span.
  const climb: Result = read((t: number): number => 0.1 * t);
  TestValidator.predicate(
    `a steady climb has no turning point, got ${show(climb)}`,
    climb.peaks.length === 0 && climb.troughs.length === 0,
  );

  // 5. A plateau.
  const plateau: Result = read((t: number): number => Math.min(t, 1, 3 - t));
  TestValidator.predicate(
    `a held top is one peak at its first instant, got ${show(plateau)}`,
    matches(plateau.peaks, [[1, 1]]) && plateau.troughs.length === 0,
  );

  // 6. Unequal strokes.
  const heights: number[] = [0.05, 0.03, 0.02];
  const fading: Result = read((t: number): number => {
    const k: number = Math.min(2, Math.floor(t));
    return heights[k]! * (1 - Math.abs(2 * (t - k) - 1));
  });
  TestValidator.predicate(
    `three fading strokes read their own heights, got ${show(fading)}`,
    matches(fading.peaks, [
      [0.5, 0.05],
      [1.5, 0.03],
      [2.5, 0.02],
    ]) &&
      matches(fading.troughs, [
        [1, 0],
        [2, 0],
      ]),
  );

  // 7. A later span.
  const later: Result = read(sine, 1);
  TestValidator.predicate(
    `from 1 s on two swings remain, got ${show(later)}`,
    matches(later.peaks, [
      [1.25, 0.04],
      [2.25, 0.04],
    ]) &&
      matches(later.troughs, [
        [1.75, -0.04],
        [2.75, -0.04],
      ]),
  );

  // 8. Bad inputs.
  TestValidator.error("a prominence of zero is refused", (): void => {
    read(sine, 0, 3, 0);
  });
  TestValidator.error("a rate of zero is refused", (): void => {
    read(sine, 0, 3, 0.01, 0);
  });
  TestValidator.error("a reversed span is refused", (): void => {
    read(sine, 3, 0);
  });
}
