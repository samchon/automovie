import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieMaterializedFile } from "./IAutoMovieMaterializedFile";

/**
 * Result of an atomic production compile.
 *
 * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `IAutoMovieBuildProjectOutput` as the portable data boundary for the diagnostics derived result finding requirement.
 * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `IAutoMovieBuildProjectOutput` for the validation derived result finding system contract.
 */
export interface IAutoMovieBuildProjectOutput {
  /**
   * Whether every error-level check through the requested scope passed. False
   * means no partial generated publication occurred.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `success` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `success` for the validation derived result finding system contract.
   */
  success: boolean;

  /**
   * Current project revision.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `revision` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `revision` for the validation derived result finding system contract.
   */
  revision: number;

  /**
   * Compiler and input identity.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `builder` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `builder` for the validation derived result finding system contract.
   */
  builder: {
    /** Compiler package version. */
    version: string;

    /** Current design and source fingerprint. */
    inputFingerprint: AutoMovieContentDigest;
  };

  /**
   * Ordered diagnostics.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `diagnostics` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `diagnostics` for the validation derived result finding system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];

  /**
   * Compiler-owned files created, updated or already current. Empty for design
   * scope and for every refused atomic compile.
   *
   * @evidence requirements/diagnostics/input-and-result-classification.md#diagnostics-derived-result-finding Exposes `materialized` as the portable data boundary for the diagnostics derived result finding requirement.
   * @evidence specifications/validation-and-diagnostics/classification-and-causality.md#validation-derived-result-finding Types `materialized` for the validation derived result finding system contract.
   */
  materialized: IAutoMovieMaterializedFile[];
}
