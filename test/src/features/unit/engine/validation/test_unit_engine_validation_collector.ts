import { ViolationCollector, toValidation, violation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
  IAutoMovieViolationCollector,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `ViolationCollector` is the sink every validator pushes into: `range` records
 * a violation only outside its bound, `warn` records advisory feedback, and
 * `toValidation` fails only when an error is present.
 *
 * Scenarios:
 *
 * 1. 0.5 in [0, 1] pushes nothing and the empty collector succeeds; 2 in [0, 1]
 *    pushes one violation and the collector fails.
 * 2. `warn` pushes a "warning"; a warning-only collector succeeds and carries the
 *    warning in `warnings`.
 * 3. An error beside a warning fails and keeps both violations.
 * 4. A default `push` is an "error" and fails on its own.
 * 5. `violation` defaults to "error", stamps "warning" when asked and keeps the
 *    overshoot 3; an empty list is a clean success.
 */
export function test_unit_engine_validation_collector(): void {
  const empty: IAutoMovieViolationCollector = new ViolationCollector();
  empty.range("$input.a", 0.5, 0, 1);
  TestValidator.equals("in range", empty.items.length, 0);
  TestValidator.equals("empty succeeds", empty.toValidation().success, true);
  const failing: IAutoMovieViolationCollector = new ViolationCollector();
  failing.range("$input.b", 2, 0, 1);
  TestValidator.equals("out of range", failing.items.length, 1);
  TestValidator.equals(
    "non-empty fails",
    failing.toValidation().success,
    false,
  );

  const warnOnly: IAutoMovieViolationCollector = new ViolationCollector();
  warnOnly.warn("physics", "$input.a", "would topple", 1);
  TestValidator.equals("warn severity", warnOnly.items[0]!.severity, "warning");
  const advisory: IAutoMovieValidation = warnOnly.toValidation();
  TestValidator.equals("warning-only succeeds", advisory.success, true);
  TestValidator.equals(
    "warning carried",
    advisory.success === true ? advisory.warnings?.length : -1,
    1,
  );

  const mixed: IAutoMovieViolationCollector = new ViolationCollector();
  mixed.warn("physics", "$input.b", "would topple", 1);
  mixed.push("type", "$input.c", "must be an id", null);
  const failed: IAutoMovieValidation = mixed.toValidation();
  TestValidator.equals("error fails", failed.success, false);
  TestValidator.equals(
    "both kept",
    failed.success === false ? failed.violations.length : -1,
    2,
  );

  const err: IAutoMovieViolationCollector = new ViolationCollector();
  err.push("type", "$input.d", "must be an id", null);
  TestValidator.equals("push severity", err.items[0]!.severity, "error");
  TestValidator.equals("error-only fails", err.toValidation().success, false);

  TestValidator.equals(
    "builder default",
    violation("range", "$input.e", "x", 1).severity,
    "error",
  );
  const warned: IAutoMovieConstraintViolation = violation(
    "physics",
    "$input.f",
    "x",
    1,
    3,
    "warning",
  );
  TestValidator.equals("builder warning", warned.severity, "warning");
  TestValidator.equals("builder overshoot", warned.overshoot, 3);
  TestValidator.equals("empty list", toValidation([]).success, true);
}
