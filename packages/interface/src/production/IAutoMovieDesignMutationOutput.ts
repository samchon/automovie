import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieDesignMutationConsequences } from "./IAutoMovieDesignMutationConsequences";
import { IAutoMovieDesignTarget } from "./IAutoMovieDesignTarget";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";

/** Result shared by the one-artifact design setters and eraser. */
export interface IAutoMovieDesignMutationOutput {
  /** Whether the complete mutation was atomically committed. */
  accepted: boolean;

  /** Current monotonic project revision. */
  revision: number;

  /** Exact addressed target. */
  target: IAutoMovieDesignTarget;

  /** Current target digest, or null when refused or erased. */
  fingerprint: AutoMovieContentDigest | null;

  /**
   * Downstream review, render and generated artifacts made stale or removed by
   * the accepted mutation, or predicted for a refused mutation.
   */
  consequences: IAutoMovieDesignMutationConsequences;

  /**
   * Validation, reference and downstream diagnostics. A refused mutation never
   * changes tracked state; accepted warnings must be corrected before compile.
   */
  diagnostics: IAutoMovieDiagnostic[];
}
