import { IAutoMovieShotPredicate } from "./IAutoMovieShotPredicate";

/**
 * One scalar predicate and the value measured by the builder.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `IAutoMovieCompiledPredicateResult` as the portable data boundary for the diagnostics derived result finding requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `IAutoMovieCompiledPredicateResult` for the validation derived result finding system contract.
 */
export interface IAutoMovieCompiledPredicateResult {
  /**
   * Exact authoritative predicate.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `predicate` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `predicate` for the validation derived result finding system contract.
   */
  predicate: IAutoMovieShotPredicate;
  /**
   * Actual sampled value, or null when the operand could not be resolved.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `actual` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `actual` for the validation derived result finding system contract.
   */
  actual: number | null;
  /**
   * Whether the authoritative comparison passed.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `passed` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `passed` for the validation derived result finding system contract.
   */
  passed: boolean;
}
