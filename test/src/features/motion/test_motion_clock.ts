import { AutoMovieMotionClock } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * An action's clock places named instants and is the one owner of progress
 * between two of them.
 *
 * Scenarios:
 * 1. Phases of 0.2, 0.3, 0 and 0.5 s laid end to end last 1 s, and each phase's
 *    name is the instant at the sum of the lengths before it; `start` and
 *    `end` are 0 and the duration.
 * 2. Uniform progress over the 0.2 to 0.5 s window is 0 before, 0.5 at 0.35 s
 *    and 1 after; a window of no length steps at its instant.
 * 3. Minimum-jerk progress is `10 u³ - 15 u⁴ + 6 u⁵` of the uniform one:
 *    0.103515625 a quarter of the way and 0.5 half way.
 * 4. An envelope that rises over the first window and falls over the last is
 *    0.5 half way up, 1 between, 0.5 half way down and 0 at the end.
 * 5. Events are the instants in time order as shares of the duration, and
 *    instants given out of order come back sorted.
 * 6. A non-positive duration, a repeated name, a reserved name, an instant
 *    past the duration, an unknown name and a negative phase length throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds clocks through both public constructors and reads every query's returned number; a window rule off by a phase, a wrong easing or an unsorted event list fails.
 * @evidence contracts/development/testing.md#independent-expectations Instants are sums of the phase lengths added by hand, and the eased values are the minimum-jerk polynomial of Flash and Hogan evaluated by hand at 1/4 and 1/2.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers before, inside and after a window, a window of no length, both easings, the envelope's four regimes, ordering, and six refused inputs.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on numbers; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 scenarios and what each pins.
 */
export function test_motion_clock(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-12;
  const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.sequence([
    { name: "prepare", seconds: 0.2 },
    { name: "strokeStart", seconds: 0.3 },
    { name: "contact", seconds: 0 },
    { name: "retract", seconds: 0.5 },
  ]);
  TestValidator.predicate(
    "phases become instants at the running sum",
    close(clock.duration, 1) &&
      clock.at("start") === 0 &&
      clock.at("prepare") === 0 &&
      close(clock.at("strokeStart"), 0.2) &&
      close(clock.at("contact"), 0.5) &&
      close(clock.at("retract"), 0.5) &&
      close(clock.at("end"), 1),
  );
  TestValidator.predicate(
    "uniform progress before, inside and after a window",
    clock.linear("strokeStart", "contact", 0.1) === 0 &&
      close(clock.linear("strokeStart", "contact", 0.35), 0.5) &&
      clock.linear("strokeStart", "contact", 0.9) === 1,
  );
  TestValidator.predicate(
    "a window of no length steps at its instant",
    clock.linear("contact", "retract", 0.49) === 0 &&
      clock.linear("contact", "retract", 0.5) === 1,
  );
  TestValidator.predicate(
    "minimum-jerk progress a quarter and half of the way",
    close(clock.progress("strokeStart", "contact", 0.275), 0.103515625) &&
      close(clock.progress("strokeStart", "contact", 0.35), 0.5) &&
      clock.progress("strokeStart", "contact", 0) === 0 &&
      clock.progress("strokeStart", "contact", 1) === 1,
  );

  const envelope = (seconds: number): number =>
    clock.envelope(["prepare", "strokeStart"], ["retract", "end"], seconds);
  TestValidator.predicate(
    "an envelope rises, holds and falls",
    close(envelope(0.1), 0.5) &&
      close(envelope(0.35), 1) &&
      close(envelope(0.75), 0.5) &&
      close(envelope(1), 0),
  );

  TestValidator.equals(
    "events in time order as shares",
    clock.events().map((e) => e.name),
    ["prepare", "strokeStart", "contact", "retract"],
  );
  TestValidator.predicate(
    "event shares",
    clock
      .events()
      .every((e, i: number): boolean => close(e.share, [0, 0.2, 0.5, 0.5][i]!)),
  );
  const unordered: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(2, [
    { name: "late", seconds: 1.5 },
    { name: "early", seconds: 0.5 },
  ]);
  TestValidator.equals(
    "instants come back sorted",
    unordered.instants.map((i) => i.name),
    ["early", "late"],
  );
  TestValidator.predicate(
    "shares of a two second clock",
    close(unordered.events()[0]!.share, 0.25) &&
      close(unordered.events()[1]!.share, 0.75),
  );

  TestValidator.error("zero duration", (): unknown =>
    AutoMovieMotionClock.of(0, []),
  );
  TestValidator.error("repeated name", (): unknown =>
    AutoMovieMotionClock.of(1, [
      { name: "a", seconds: 0.1 },
      { name: "a", seconds: 0.2 },
    ]),
  );
  TestValidator.error("reserved name", (): unknown =>
    AutoMovieMotionClock.of(1, [{ name: "start", seconds: 0.1 }]),
  );
  TestValidator.error("instant past the duration", (): unknown =>
    AutoMovieMotionClock.of(1, [{ name: "a", seconds: 1.1 }]),
  );
  TestValidator.error("unknown name", (): unknown => clock.at("landing"));
  TestValidator.error("negative phase", (): unknown =>
    AutoMovieMotionClock.sequence([{ name: "a", seconds: -0.1 }]),
  );
}
