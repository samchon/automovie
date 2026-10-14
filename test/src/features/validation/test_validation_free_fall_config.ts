import { detectFreeFall } from "@automovie/engine";
import { IAutoMovieBody } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../internal/predicates";

const BODY: IAutoMovieBody = {
  mass: 1,
  centerOfMass: null,
  friction: 0.5,
  restitution: 0.5,
};

const fall: (over: { margin?: number; fallDuration?: number }) => ReturnType<typeof detectFreeFall> = (over: { margin?: number; fallDuration?: number }): ReturnType<typeof detectFreeFall> =>
  detectFreeFall({
    body: BODY,
    centerOfMass: { x: 0, y: 5, z: 0 },
    support: [],
    attached: false,
    falling: false,
    ...over,
  });

/**
 * Refuse invalid support-margin and proposal-duration settings through the detector's range-error result.
 *
 * Scenarios:
 *
 * 1. A negative margin is a range violation on `margin`.
 * 2. A non-finite margin is a range violation on `margin`.
 * 3. A zero fall duration is a range violation on `fallDuration`.
 * 4. A non-finite fall duration is a range violation on `fallDuration`.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual free-fall detection with each invalid setting and requires its located range finding, with explicit failure assertions for negative margin and zero duration.
 * @evidence contracts/testing.md#independent-expectations A distance margin must be finite and nonnegative; trajectory duration must be finite and positive. Literal setting paths distinguish admission failure from an unrelated body or support verdict.
 * @evidence contracts/testing.md#distinguishing-cases Covers negative/NaN margin and zero/infinite duration; valid proposal/support and suppression cases live in the other free-fall entries. This entry does not assert returned event or trajectory populations.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns four detector calls through a private local helper using existing numerical records, without a native artifact, process or physics host.
 */
export function test_validation_free_fall_config(): void {
  const negMargin: ReturnType<typeof detectFreeFall> = fall({ margin: -1 });
  TestValidator.equals(
    "negative margin fails",
    negMargin.validation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on margin",
    hasViolation(negMargin.validation, "range", ".margin"),
  );
  TestValidator.predicate(
    "range violation on non-finite margin",
    hasViolation(fall({ margin: Number.NaN }).validation, "range", ".margin"),
  );

  const zeroDuration: ReturnType<typeof detectFreeFall> = fall({ fallDuration: 0 });
  TestValidator.equals(
    "zero fallDuration fails",
    zeroDuration.validation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on fallDuration",
    hasViolation(zeroDuration.validation, "range", ".fallDuration"),
  );
  TestValidator.predicate(
    "range violation on non-finite fallDuration",
    hasViolation(
      fall({ fallDuration: Number.POSITIVE_INFINITY }).validation,
      "range",
      ".fallDuration",
    ),
  );
}
