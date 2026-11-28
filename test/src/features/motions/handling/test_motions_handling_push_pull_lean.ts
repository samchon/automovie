import {
  pushPullLean
} from "../../../../../packages/motions/src/handling/internal/pushPullLean";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of one linear interpolation, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `pushPullLean` is the trunk's lean against a load moved by handles: the
 * measured lean of the load's class at the waist and at the shoulder,
 * interpolated by the handles' height between them and clamped outside, forward
 * for a push or a drag and backward (negative) for a pull.
 *
 * Scenarios, a 1.0 m waist and a 1.45 m shoulder height:
 *
 * 1. A heavy push at the waist leans 18.7 degrees, at the shoulder 25.1, half way
 *    21.9.
 * 2. A heavy pull half way leans back `(17.7 + 21.8) / 2 = 19.75`.
 * 3. A drag takes the push's table; handles under the waist hold its lean.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines table-driven trunk lean by load, direction and handle height with clamping outside the waist-to-shoulder interval.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates one heavy load at waist, shoulder and middle height for push and pull, and at a lower drag height.
 * @evidence contracts/development/testing.md#independent-expectations Declared push endpoints 18.7° and 25.1° interpolate to 21.9°. The pull mean 19.75° has opposite sign and the low drag uses the push's waist value.
 */
export function test_motions_handling_push_pull_lean(): void {
  const body: Parameters<typeof pushPullLean>[0] = {
    measure: { waistHeight: 1.0, shoulderHeight: 1.45 },
  };
  TestValidator.predicate(
    "a heavy push",
    nclose(pushPullLean(body, "push", "heavy", 1.0), 18.7, ROUNDING) &&
      nclose(pushPullLean(body, "push", "heavy", 1.45), 25.1, ROUNDING) &&
      nclose(pushPullLean(body, "push", "heavy", 1.225), 21.9, ROUNDING),
  );
  TestValidator.predicate(
    "a heavy pull",
    nclose(pushPullLean(body, "pull", "heavy", 1.225), -19.75, ROUNDING),
  );
  TestValidator.predicate(
    "a drag",
    nclose(pushPullLean(body, "drag", "light", 0.6), 7.2, ROUNDING),
  );
}
