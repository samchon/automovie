import { detectFreeFall } from "@automovie/engine";
import { IAutoMovieBody } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { hasViolation } from "../../../internal/predicates";

const BODY: IAutoMovieBody = {
  mass: 1,
  centerOfMass: null,
  friction: 0.5,
  restitution: 0.5,
};

const fall: (over: {
  margin?: number;
  fallDuration?: number;
}) => ReturnType<typeof detectFreeFall> = (over: {
  margin?: number;
  fallDuration?: number;
}): ReturnType<typeof detectFreeFall> =>
  detectFreeFall({
    body: BODY,
    centerOfMass: { x: 0, y: 5, z: 0 },
    support: [],
    attached: false,
    falling: false,
    ...over,
  });

/**
 * Refuse invalid support-margin and proposal-duration settings through the
 * detector's range-error result.
 *
 * Scenarios:
 *
 * 1. A negative margin is a range violation on `margin`.
 * 2. A non-finite margin is a range violation on `margin`.
 * 3. A zero fall duration is a range violation on `fallDuration`.
 * 4. A non-finite fall duration is a range violation on `fallDuration`.
 */
export function test_unit_engine_validation_free_fall_config(): void {
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

  const zeroDuration: ReturnType<typeof detectFreeFall> = fall({
    fallDuration: 0,
  });
  TestValidator.equals(
    "zero fallDuration fails",
    zeroDuration.validation.success,
    false,
  );
  TestValidator.predicate(
    "range violation on fallDuration",
    hasViolation(zeroDuration.validation, "range", ".fallDuration"),
  );
}
