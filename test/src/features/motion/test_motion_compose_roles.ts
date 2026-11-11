import { AutoMovieMotionHumanTiming } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * A phase length on its rungs: a pause name, a pause with a scale, and
 * explicit seconds with their source; and a phrase built from them by role.
 *
 * The pauses are none 0 s, brief 0.15 s, beat 0.4 s and long 0.8 s.
 *
 * Scenarios:
 * 1. A beat is 0.4 s; a beat scaled by 1.25 is 0.5 s; explicit 0.2 s with a
 *    source is 0.2 s.
 * 2. A travel of 0.3 m without a width is the free-space rule's time,
 *    0.25 + 0.5 x 0.3 = 0.4 s.
 * 3. A phrase with no preparation, an explicit attack of 0.2 s and a beat's
 *    retraction is exactly `{ prepare: 0, attack: 0.2, retract: 0.4 }`: the
 *    wait, the follow and the hold left out stay out.
 * 4. A phrase with a brief hold has a hold of 0.15 s.
 * 5. A scale of 2, negative explicit seconds and explicit seconds with an
 *    empty source throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads the seconds and the phrase record; a scale that is not applied, an absent phase given a length, or an accepted empty source fails.
 * @evidence contracts/development/testing.md#independent-expectations Every number is a stated pause times a stated scale, or the stated rule's base and rate on the stated distance, worked out by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers each rung, a phrase with and without an optional phase, and one refusal per rule.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the pauses and lists the 5 scenarios with their numbers.
 */
export function test_motion_compose_roles(): void {
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;
  const seconds = AutoMovieMotionHumanTiming.seconds;
  const source: string = "provisional: test";

  TestValidator.predicate(
    "a pause on three rungs",
    near(seconds("beat"), 0.4) &&
      near(seconds({ pause: "beat", scale: 1.25 }), 0.5) &&
      near(seconds({ seconds: 0.2, source }), 0.2),
  );
  TestValidator.predicate(
    "a travel in free space",
    near(seconds({ distance: 0.3 }), 0.4),
  );
  TestValidator.equals(
    "a phrase keeps an absent phase absent",
    AutoMovieMotionHumanTiming.phrase({
      prepare: "none",
      attack: { seconds: 0.2, source },
      retract: "beat",
    }),
    { prepare: 0, attack: 0.2, retract: 0.4 },
  );
  TestValidator.equals(
    "a phrase with a hold",
    AutoMovieMotionHumanTiming.phrase({
      prepare: "none",
      attack: { seconds: 0.2, source },
      hold: "brief",
      retract: "beat",
    }),
    { prepare: 0, attack: 0.2, hold: 0.15, retract: 0.4 },
  );

  TestValidator.error("a scale past its bound", (): unknown =>
    seconds({ pause: "beat", scale: 2 }),
  );
  TestValidator.error("negative explicit seconds", (): unknown =>
    seconds({ seconds: -0.1, source }),
  );
  TestValidator.error("explicit seconds without a source", (): unknown =>
    seconds({ seconds: 0.2, source: "" }),
  );
}
