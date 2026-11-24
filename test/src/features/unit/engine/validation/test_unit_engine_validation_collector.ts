import { ViolationCollector } from "@automovie/engine";
import {
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `ViolationCollector` is the shared sink every validator pushes into, and the
 * bridge to the harness: its `range` helper records a violation only when a
 * value is outside its finite bound. Empty and range-error collectors expose
 * clean success and failure respectively; warning-only folding is outside these
 * cases.
 *
 * Scenarios:
 *
 * 1. An in-range value (0.5 in [0,1]) pushes nothing, and an empty collector
 *    yields a successful validation.
 * 2. An out-of-range value (2 in [0,1]) pushes one violation, and a non-empty
 *    collector yields a failed validation.
 * 3. A non-finite value (`NaN`) pushes one violation; bounded ranges are finite
 *    numeric domains.
 */
export function test_unit_engine_validation_collector(): void {
  const empty: IAutoMovieViolationCollector = new ViolationCollector();
  empty.range("$input.a", 0.5, 0, 1);
  TestValidator.equals("in-range pushes nothing", empty.items.length, 0);
  TestValidator.equals(
    "empty collector → success",
    empty.toValidation().success,
    true,
  );

  const failing: IAutoMovieViolationCollector = new ViolationCollector();
  failing.range("$input.b", 2, 0, 1);
  TestValidator.equals("out-of-range pushes one", failing.items.length, 1);
  const validation: IAutoMovieValidation = failing.toValidation();
  TestValidator.equals(
    "non-empty collector → failure",
    validation.success,
    false,
  );

  const nonFinite: IAutoMovieViolationCollector = new ViolationCollector();
  nonFinite.range("$input.c", Number.NaN, 0, 1);
  TestValidator.equals("non-finite pushes one", nonFinite.items.length, 1);
}
