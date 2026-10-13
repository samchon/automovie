import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieMaterializedFile } from "./IAutoMovieMaterializedFile";

/**
 * Result of production admission and atomic generated-output publication. The revision and input fingerprint identify the snapshot judged by diagnostics.
 *
 * @evidence contracts/common.md#principled-implementation Success reports completion of every requested error-level gate for one revision and fingerprint; builder publication is atomic, so refused compiles return no partial materialized-file result.
 * @evidence contracts/common.md#clear-and-simple-design Status, snapshot identity, ordered diagnostics and materialized-file effects are separate output fields, allowing clients to distinguish a failed judgment from an unchanged successful publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A prior compile fingerprint cannot certify changed inputs, and refused source work is not reported as a partially accepted generated publication.
 * @evidence contracts/common.md#meaningful-documentation Defines error-level success, revision and builder identity, ordered findings and empty materialization for design-only or refused compilation.
 * @author Samchon
 */
export interface IAutoMovieBuildProjectOutput {
  /**
   * Whether every error-level check through the requested scope passed. False means no partial generated publication occurred.
   */
  success: boolean;

  /** Current project revision. */
  revision: number;

  /** Compiler and input identity. */
  builder: {
    /** Compiler package version. */
    version: string;

    /** Current design and source fingerprint. */
    inputFingerprint: string;
  };

  /** Ordered diagnostics. */
  diagnostics: IAutoMovieDiagnostic[];

  /**
   * Compiler-owned files created, updated or already current. Empty for design scope and for every refused atomic compile.
   */
  materialized: IAutoMovieMaterializedFile[];
}
