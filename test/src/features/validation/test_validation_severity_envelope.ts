import { ViolationCollector, toValidation, violation } from "@automovie/engine";
import type {
  IAutoMovieConstraintViolation,
  IAutoMovieValidation,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, validationHasWarningCount } from "../internal/predicates";

/**
 * `warn` records advisory feedback; `toValidation` fails only when an error is present and preserves warning-only feedback on a successful envelope.
 *
 * Scenarios:
 *
 * 1. `warn` pushes a `"warning"`-severity violation; a warning-only collector
 *    succeeds and carries the warning in `warnings`.
 * 2. An error alongside a warning fails, and the failure's `violations` keeps both
 *    (a warning is not dropped just because an error co-occurs).
 * 3. A default `push` is `"error"` severity and fails on its own.
 * 4. The `violation` builder defaults to `"error"` and stamps `"warning"` when
 *    asked, preserving `overshoot`; an empty list is a clean success.
 *
 * @evidence contracts/testing.md#behavioral-verification Constructs actual collector findings and converts their arrays, checking warning-only success, mixed failure with both rows, default error severity and explicit warning/overshoot fields. Advisory feedback cannot silently block correction or disappear beside an error.
 * @evidence contracts/testing.md#independent-expectations The declared error-versus-warning contract supplies expected severity and envelope outcomes; authored one/two-row inputs supply counts independently of conversion output. This unit does not judge whether a caller chose the appropriate physical severity.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts empty, warning-only, error-only and mixed populations, plus default and explicit builder severity. Located field admission belongs to validators; this unit owns envelope consequence and preservation of coexistence.
 * @evidence contracts/testing.md#execution-ownership The named portable unit invokes collector/builder/conversion APIs directly using local records. No filesystem, consumer installation or render host participates, and no external harness registers these cases.
 */
export function test_validation_severity_envelope(): void {
  const warnOnly: ViolationCollector = new ViolationCollector();
  warnOnly.warn("physics", "$input.a", "would topple", 1);
  TestValidator.equals(
    "warn is warning severity",
    warnOnly.items[0]!.severity,
    "warning",
  );
  const wv: IAutoMovieValidation = warnOnly.toValidation();
  TestValidator.predicate(
    "warning surfaced in warnings",
    validationHasWarningCount("warning-only envelope", wv, 1),
  );

  const mixed: ViolationCollector = new ViolationCollector();
  mixed.warn("physics", "$input.b", "would topple", 1);
  mixed.push("type", "$input.c", "must be an id", null);
  const mv: IAutoMovieValidation = mixed.toValidation();
  TestValidator.equals("error alongside warning fails", mv.success, false);
  TestValidator.equals(
    "both violations kept on failure",
    mv.success === false ? mv.violations.length : -1,
    2,
  );

  const err: ViolationCollector = new ViolationCollector();
  err.push("type", "$input.d", "must be an id", null);
  TestValidator.equals(
    "default push is error severity",
    err.items[0]!.severity,
    "error",
  );
  TestValidator.equals("error-only fails", err.toValidation().success, false);

  TestValidator.equals(
    "builder defaults to error",
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
  TestValidator.equals("builder stamps warning", warned.severity, "warning");
  TestValidator.predicate(
    "builder preserves overshoot",
    warned.overshoot !== null &&
      warned.overshoot !== undefined &&
      nclose(warned.overshoot, 3, 0),
  );

  TestValidator.equals("empty list succeeds", toValidation([]).success, true);
}
