import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieMaterializedFile } from "./IAutoMovieMaterializedFile";

/** Result of an atomic production compile. */
export interface IAutoMovieBuildProjectOutput {
  /**
   * Whether every error-level check through the requested scope passed. False
   * means no partial generated publication occurred.
   */
  success: boolean;

  /** Current project revision. */
  revision: number;

  /** Compiler and input identity. */
  builder: {
    /** Compiler package version. */
    version: string;

    /** Current design and source fingerprint. */
    inputFingerprint: AutoMovieContentDigest;
  };

  /** Ordered diagnostics. */
  diagnostics: IAutoMovieDiagnostic[];

  /**
   * Compiler-owned files created, updated or already current. Empty for design
   * scope and for every refused atomic compile.
   */
  materialized: IAutoMovieMaterializedFile[];
}
