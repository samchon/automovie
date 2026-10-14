import {
  IAutoMovieActionCall,
  IAutoMoviePerformance,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMoviePerformedShot, IAutoMovieStagedSet, performShot, stageScene } from "@automovie/engine";



import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { hasViolation, namedFacts } from "../internal/predicates";

const gesture: (
  partial?: Partial<IAutoMovieActionCall & { verb: "gesture" }>,
) => IAutoMovieActionCall & { verb: "gesture" } = (
  partial: Partial<IAutoMovieActionCall & { verb: "gesture" }> = {},
): IAutoMovieActionCall & { verb: "gesture" } => ({
  verb: "gesture",
  actor: "knightA",
  start: 0,
  duration: 1,
  kind: "wave",
  ...partial,
});

const run: (
  partial: Partial<IAutoMoviePerformance>,
) => IAutoMoviePerformedShot = (
  partial: Partial<IAutoMoviePerformance>,
): IAutoMoviePerformedShot => {
  const staged: IAutoMovieStagedSet = stageScene(
    makeScriptWrite(),
    makeStagingWrite(),
  );
  if (staged.success !== true) throw new Error("staging must succeed");
  return performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({
      draft: [gesture()],
      revise: { review: "unchanged.", final: null },
      ...partial,
    }),
    synthesize: validSynthesizer,
    skeleton: (): IAutoMovieSkeleton => createSkeleton(),
  });
};

/**
 * Performs authored non-finite shot/action clocks and checks failure plus each owning range path before span arithmetic can use those values.
 *
 * Scenarios:
 * 1. Refuse infinite shot duration at the shot field.
 * 2. Refuse NaN action start at its authored field.
 * 3. Refuse infinite action duration while the shot duration is also infinite.
 *
 * @evidence contracts/testing.md#behavioral-verification Performs authored non-finite shot/action clocks and checks failure plus each owning range path before span arithmetic can use those values.
 * @evidence contracts/testing.md#independent-expectations Finite positive shot duration and finite action clocks exclude Infinity and NaN by their input contract; the explicit expected input paths do not come from the gate's own list.
 * @evidence contracts/testing.md#distinguishing-cases Preserves infinite shot span, NaN action start and infinite action duration (with an infinite shot span as originally supplied); valid finite clocks are exercised by other perform entries.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous test_film_perform_shot_non_finite_timing unit entry owns its assertions and delegated helpers through portable source functions; it opens no process, browser, GPU or installed consumer.
 */
export function test_film_perform_shot_non_finite_timing(): void {
  const infiniteShotDuration: IAutoMoviePerformedShot = run({
    duration: Number.POSITIVE_INFINITY,
  });
  TestValidator.equals(
    "infinite shot duration fails",
    infiniteShotDuration.success,
    false,
  );
  TestValidator.equals(
    "infinite shot duration rejected",
    namedFacts([
      ["refused", (): boolean => infiniteShotDuration.success === false],
      [
        "violated",
        (): boolean =>
          infiniteShotDuration.success === false &&
          hasViolation(infiniteShotDuration, "range", "$input.duration"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const nanStart: IAutoMoviePerformedShot = run({
    draft: [gesture({ start: Number.NaN })],
  });
  TestValidator.equals("nan start fails", nanStart.success, false);
  TestValidator.equals(
    "nan start rejected",
    namedFacts([
      ["refused", (): boolean => nanStart.success === false],
      [
        "violated",
        (): boolean =>
          nanStart.success === false &&
          hasViolation(nanStart, "range", "$input.draft[0].start"),
      ],
    ]),
    { refused: true, violated: true },
  );

  const infiniteActionDuration: IAutoMoviePerformedShot = run({
    duration: Number.POSITIVE_INFINITY,
    draft: [gesture({ duration: Number.POSITIVE_INFINITY })],
  });
  TestValidator.equals(
    "infinite action duration fails",
    infiniteActionDuration.success,
    false,
  );
  TestValidator.equals(
    "infinite action duration rejected",
    namedFacts([
      ["refused", (): boolean => infiniteActionDuration.success === false],
      [
        "violated",
        (): boolean =>
          infiniteActionDuration.success === false &&
          hasViolation(
            infiniteActionDuration,
            "range",
            "$input.draft[0].duration",
          ),
      ],
    ]),
    { refused: true, violated: true },
  );
}
