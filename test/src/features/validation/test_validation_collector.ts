import { ViolationCollector } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `ViolationCollector` is the shared sink every validator pushes into, and the
 * bridge to the harness: its `range` helper records a violation only when a
 * value is outside its finite bound. Empty and range-error collectors expose
 * clean success and failure respectively; warning-only folding is outside these cases.
 *
 * Scenarios:
 *
 * 1. An in-range value (0.5 in [0,1]) pushes nothing, and an empty collector
 *    yields a successful validation.
 * 2. An out-of-range value (2 in [0,1]) pushes one violation, and a non-empty
 *    collector yields a failed validation.
 * 3. A non-finite value (`NaN`) pushes one violation; bounded ranges are finite
 *    numeric domains.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls range and toValidation, checking that an interior value remains clean while an over-limit value and NaN produce findings; only the over-limit finding's failed result is asserted.
 * @evidence contracts/testing.md#independent-expectations The stated finite interval [0,1] independently admits 0.5 and excludes 2 and NaN; exact row counts and the NaN field/message check catch omitted or duplicated findings without deriving an expectation from the collector.
 * @evidence contracts/testing.md#distinguishing-cases Interior, upper overshoot, and non-finite inputs distinguish acceptance from range refusal. Endpoint, lower overshoot, warning-only folding, and mixed severity are not covered here.
 * @evidence contracts/testing.md#execution-ownership The named test_validation_collector entry exercises portable in-memory validation without a host or dynamically registered cases.
 */
export function test_validation_collector(): void {
  const empty: ViolationCollector = new ViolationCollector();
  empty.range("$input.a", 0.5, 0, 1);
  TestValidator.equals("in-range pushes nothing", empty.items.length, 0);
  TestValidator.equals(
    "empty collector → success",
    empty.toValidation().success,
    true,
  );

  const failing: ViolationCollector = new ViolationCollector();
  failing.range("$input.b", 2, 0, 1);
  TestValidator.equals("out-of-range pushes one", failing.items.length, 1);
  const validation: IAutoMovieValidation = failing.toValidation();
  TestValidator.equals(
    "non-empty collector → failure",
    validation.success,
    false,
  );

  const nonFinite: ViolationCollector = new ViolationCollector();
  nonFinite.range("$input.c", Number.NaN, 0, 1);
  TestValidator.equals("non-finite pushes one", nonFinite.items.length, 1);
  TestValidator.predicate(
    "non-finite range mentions finite",
    nonFinite.items.some(
      (v: IAutoMovieConstraintViolation): boolean =>
        v.path === "$input.c" && v.expected.includes("finite"),
    ),
  );
}
