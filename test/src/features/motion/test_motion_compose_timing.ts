import { AutoMovieMotionHumanTiming } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * How long a movement lasts: the free-space rule, the aimed rule, and which
 * of the two a place asks for.
 *
 * Scenarios:
 * 1. In free space a hand travels 0.4 m in 0.45 s and no distance in 0.25 s; a
 *    negative distance counts as none.
 * 2. Stopping on a target 50 mm wide 300 mm away takes the published model's
 *    `-306.07 + 297.27 lg 300 + 0.65 * 50` milliseconds; a wider target takes
 *    longer, and a negative width counts as a point.
 * 3. An amplitude of 50 mm takes the time of 170 mm, the shortest amplitude
 *    the model was fitted to.
 * 4. A solid place with a width is aimed at; a solid place without a width
 *    and a place that is not solid take the free-space rule.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the three public functions and reads the seconds; a swapped rule, a wrong unit of the width or an extrapolated short amplitude fails.
 * @evidence contracts/development/testing.md#independent-expectations The aimed times are written from the paper's coefficients in milliseconds and millimetres, the units of its table, not from the module's constants in seconds and metres; the free-space times are computed by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both rules, the floor of each input, the short-amplitude clamp on both of its sides, and the three kinds of place.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit that needs no body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 scenarios and what each pins.
 */
export function test_motion_compose_timing(): void {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;
  const paper = (millimetres: number, width: number): number =>
    (-306.07 + 297.27 * Math.log10(millimetres) + 0.65 * width) / 1000;

  TestValidator.predicate(
    "free-space time",
    close(AutoMovieMotionHumanTiming.transport(0.4), 0.45) &&
      close(AutoMovieMotionHumanTiming.transport(0), 0.25) &&
      close(AutoMovieMotionHumanTiming.transport(-1), 0.25),
  );
  TestValidator.predicate(
    "aimed time",
    close(AutoMovieMotionHumanTiming.aimed(0.3, 0.05), paper(300, 50)) &&
      AutoMovieMotionHumanTiming.aimed(0.3, 0.1) >
        AutoMovieMotionHumanTiming.aimed(0.3, 0.05) &&
      close(AutoMovieMotionHumanTiming.aimed(0.3, -0.05), paper(300, 0)),
  );
  TestValidator.predicate(
    "a short amplitude takes the shortest fitted one's time",
    close(AutoMovieMotionHumanTiming.aimed(0.05, 0), paper(170, 0)) &&
      close(AutoMovieMotionHumanTiming.aimed(0.17, 0), paper(170, 0)) &&
      AutoMovieMotionHumanTiming.aimed(0.2, 0) > paper(170, 0),
  );
  TestValidator.predicate(
    "the place chooses the rule",
    close(
      AutoMovieMotionHumanTiming.of(0.3, { solid: true, width: 0.05 }),
      paper(300, 50),
    ) &&
      close(AutoMovieMotionHumanTiming.of(0.3, { solid: true }), 0.4) &&
      close(
        AutoMovieMotionHumanTiming.of(0.3, { solid: false, width: 0.05 }),
        0.4,
      ),
  );
}
