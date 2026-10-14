import { IAutoMovieDesignMutationConsequences } from "./IAutoMovieDesignMutationConsequences";
import { IAutoMovieDesignTarget } from "./IAutoMovieDesignTarget";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";

/**
 * Atomic design-setter or erasure result with revision, diagnostics and predicted downstream consequences. Refusal preserves tracked state; a refused erasure may still report the existing target's fingerprint.
 *
 * @evidence contracts/common.md#principled-implementation Accepted mutation commits the addressed design and its audit effects under the project revision boundary; refusal leaves tracked state unchanged while exposing validation findings and predicted dependency consequences.
 * @evidence contracts/common.md#clear-and-simple-design Acceptance, current revision, exact target, optional fingerprint, consequences and diagnostics separate commit outcome from the information needed to correct a refused mutation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refused setters do not partially update tracked records, and fingerprint presence does not imply acceptance because an actively referenced target may be identified while its erasure is refused.
 * @evidence contracts/common.md#meaningful-documentation Gives atomic accepted semantics, revision ownership, target identity, fingerprint absence and refused-erasure exception, predicted consequences and diagnostic correction requirements.
 * @author Samchon
 */
export interface IAutoMovieDesignMutationOutput {
  /** Whether the complete mutation was atomically committed. */
  accepted: boolean;

  /** Current monotonic project revision. */
  revision: number;

  /** Exact addressed target. */
  target: IAutoMovieDesignTarget;

  /** Committed target digest or an identified refused-erasure target; null when unavailable or erased. */
  fingerprint: string | null;

  /**
   * Predicted downstream review, render and generated-output dependencies for this mutation. These lists do not attest that each receipt was invalidated or each file removed, even when accepted is true.
   */
  consequences: IAutoMovieDesignMutationConsequences;

  /**
   * Validation, reference and downstream diagnostics. A refused mutation preserves tracked state; advisory warnings remain visible, while error-level compile findings block publication.
   */
  diagnostics: IAutoMovieDiagnostic[];
}
