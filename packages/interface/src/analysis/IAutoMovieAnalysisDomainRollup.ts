import { AutoMovieAnalysisDomain } from "./AutoMovieAnalysisDomain";

/**
 * One domain's tally, in the fixed domain order.
 *
 * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `IAutoMovieAnalysisDomainRollup` as the portable data boundary for the diagnostics stable order requirement.
 * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `IAutoMovieAnalysisDomainRollup` for the validation canonical diagnostic order system contract.
 */
export interface IAutoMovieAnalysisDomainRollup {
  /**
   * Domain this row answers for.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `domain` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `domain` for the validation canonical diagnostic order system contract.
   */
  domain: AutoMovieAnalysisDomain;

  /**
   * Runs submitted for the domain.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `runs` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `runs` for the validation canonical diagnostic order system contract.
   */
  runs: number;

  /**
   * Runs that solved against the current revision.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `solved` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `solved` for the validation canonical diagnostic order system contract.
   */
  solved: number;

  /**
   * Runs the host cannot perform.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `unsupported` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `unsupported` for the validation canonical diagnostic order system contract.
   */
  unsupported: number;

  /**
   * Runs an adapter could have performed but did not.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `notRun` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `notRun` for the validation canonical diagnostic order system contract.
   */
  notRun: number;

  /**
   * Solved runs that read a superseded design revision.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `stale` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `stale` for the validation canonical diagnostic order system contract.
   */
  stale: number;

  /**
   * Metrics declared across the domain's current solved runs.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `metrics` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `metrics` for the validation canonical diagnostic order system contract.
   */
  metrics: number;

  /**
   * Of those, the ones that produced a value.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `measured` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `measured` for the validation canonical diagnostic order system contract.
   */
  measured: number;

  /**
   * Of the measured ones, those satisfying a declared target.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `meets` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `meets` for the validation canonical diagnostic order system contract.
   */
  meets: number;

  /**
   * Of the measured ones, those violating a declared target.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `misses` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `misses` for the validation canonical diagnostic order system contract.
   */
  misses: number;

  /**
   * Whether the production required this domain to be answered.
   *
   * @evidence requirements/diagnostics/collection-fail-fast-and-determinism.md#diagnostics-stable-order Exposes `required` as the portable data boundary for the diagnostics stable order requirement.
   * @evidence specifications/validation-and-diagnostics/collection-order-and-termination.md#validation-canonical-diagnostic-order Types `required` for the validation canonical diagnostic order system contract.
   */
  required: boolean;
}
