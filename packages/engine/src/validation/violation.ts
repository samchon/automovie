import { AutoMovieViolationKind, IAutoMovieConstraintViolation } from "@automovie/interface";

/**
 * Build one {@link IAutoMovieConstraintViolation}. Defaults to `"error"`.
 *
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-path-and-scope `violation` binds one discovered value to its caller-supplied structural path and expected constraint.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-path-scope `violation` constructs the canonical kind, severity, path, observation, and optional overshoot record without widening its scope.
 * @evidence requirements/diagnostics/identity-path-and-context.md#diagnostics-cause-observed-expected `violation` preserves the finding kind, expected constraint, observed value, and optional numeric overshoot in one record.
 * @evidence specifications/validation-and-diagnostics/diagnostic-identity-location-and-severity.md#validation-diagnostic-cause-values The constructor keeps machine-readable cause classification beside the exact expected and observed values that produced the finding.
 * @evidence requirements/diagnostics/localization-and-machine-results.md#diagnostics-machine-readable-result `violation` returns a structured diagnostic object whose kind, path, severity, expectation, observation, and overshoot remain directly inspectable.
 * @evidence specifications/validation-and-diagnostics/localization-and-machine-results.md#validation-machine-result-envelope The violation record supplies typed fields for programmatic handling instead of encoding its result only in prose.
 */
export const violation = (
  kind: AutoMovieViolationKind,
  path: string,
  expected: string,
  value: unknown,
  overshoot?: number,
  severity: "error" | "warning" = "error",
): IAutoMovieConstraintViolation =>
  overshoot === undefined
    ? { kind, path, expected, value, severity }
    : { kind, path, expected, value, overshoot, severity };
