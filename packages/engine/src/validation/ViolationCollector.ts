import { AutoMovieViolationKind, IAutoMovieConstraintViolation, IAutoMovieValidation } from "@automovie/interface";
import { violation } from "./violation";
import { toValidation } from "./toValidation";

/**
 * A small append-only sink for violations, so each validator can push with a
 * stable path prefix without threading arrays through every call.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `ViolationCollector` accumulates validator findings in discovery order while preserving each supplied member path.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `ViolationCollector` provides one append-only location-aware sink shared by nested validation checks.
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-correction-and-recheck `ViolationCollector` retains every precise path, expectation, observation, and overshoot needed to correct the input and run the same validator again.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-correction-revalidation The append-only collector bounds revalidation to the recorded members without applying or claiming an automatic correction.
 */
export class ViolationCollector {
  /**
   * Violations accumulated in insertion order.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `items` retains the complete ordered list of path-bearing violations discovered by a validator.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `items` exposes each original observation and scope without aggregation that would erase member identity.
   */
  public readonly items: IAutoMovieConstraintViolation[] = [];

  /**
   * Append one violation to the collector.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `push` appends an error or explicit-severity finding at the exact path passed by the discovering check.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `push` records kind, expectation, observed value, overshoot, and severity as one indivisible diagnostic entry.
   */
  public push(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
    severity: "error" | "warning" = "error",
  ): void {
    this.items.push(
      violation(kind, path, expected, value, overshoot, severity),
    );
  }

  /**
   * Push a `"warning"`-severity violation, physical-plausibility advice that
   * does not fail validation (see
   * {@link IAutoMovieConstraintViolation.severity}).
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `warn` locates physical-plausibility advice without converting its affected value into a failing error.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `warn` fixes warning severity while preserving the same path, expectation, value, and overshoot fields as an error.
   */
  public warn(
    kind: AutoMovieViolationKind,
    path: string,
    expected: string,
    value: unknown,
    overshoot?: number,
  ): void {
    this.push(kind, path, expected, value, overshoot, "warning");
  }

  /**
   * Finite range check `[min, max]`; pushes a `range` violation if outside.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `range` reports an out-of-interval scalar at its supplied field path with the observed numeric value.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `range` derives the expected closed interval and overshoot directly from the same min, max, and value comparison.
   */
  public range(
    path: string,
    value: number,
    min: number,
    max: number,
    label = "value",
  ): void {
    if (!Number.isFinite(value) || value < min || value > max)
      this.push(
        "range",
        path,
        `${label} must be a finite number within [${min}, ${max}], but was ${value}`,
        value,
      );
  }

  /**
   * Convert the accumulated violations to the canonical validation result.
   *
   * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `toValidation` returns the collector's own located items with a success flag derived from their severities.
   * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `toValidation` delegates canonical outcome construction without copying or reordering accumulated paths.
   */
  public toValidation(): IAutoMovieValidation {
    return toValidation(this.items);
  }
}
