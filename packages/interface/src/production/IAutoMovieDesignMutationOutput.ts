import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieDesignTarget } from "./IAutoMovieDesignTarget";
import { IAutoMovieDesignMutationConsequences } from "./IAutoMovieDesignMutationConsequences";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";

/**
 * Result shared by the one-artifact design setters and eraser.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `IAutoMovieDesignMutationOutput` as the portable data boundary for the diagnostics derived result finding requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `IAutoMovieDesignMutationOutput` for the validation derived result finding system contract.
 */
export interface IAutoMovieDesignMutationOutput {
  /**
   * Whether the complete mutation was atomically committed.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `accepted` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `accepted` for the validation derived result finding system contract.
   */
  accepted: boolean;

  /**
   * Current monotonic project revision.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `revision` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `revision` for the validation derived result finding system contract.
   */
  revision: number;

  /**
   * Exact addressed target.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `target` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `target` for the validation derived result finding system contract.
   */
  target: IAutoMovieDesignTarget;

  /**
   * Current target digest, or null when refused or erased.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `fingerprint` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `fingerprint` for the validation derived result finding system contract.
   */
  fingerprint: AutoMovieContentDigest | null;

  /**
   * Downstream review, render and generated artifacts made stale or removed by
   * the accepted mutation, or predicted for a refused mutation.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `consequences` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `consequences` for the validation derived result finding system contract.
   */
  consequences: IAutoMovieDesignMutationConsequences;

  /**
   * Validation, reference and downstream diagnostics. A refused mutation never
   * changes tracked state; accepted warnings must be corrected before compile.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `diagnostics` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `diagnostics` for the validation derived result finding system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];
}
