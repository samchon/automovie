/**
 * Descriptive metadata and cost basis for the generator behind repaint.
 *
 * The cost basis and production consumer accompany the selected runtime.
 *
 * @evidence contracts/common.md#principled-implementation Canonical provenance requires a nonblank authored cost basis and reasoned repaint consumer, retaining supplied source, license and terms date as strings without credential-bearing locators.
 * @evidence contracts/common.md#clear-and-simple-design Required cost and consumer explain production adoption while optional metadata describes provenance without embedding provider credentials or another execution policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional metadata is not a verified license or terms-review receipt and no calendar-date validator proves a review happened; the host preserves the exact authored context rather than inventing missing provenance.
 * @evidence contracts/common.md#meaningful-documentation Defines optional descriptive fields, explicit cost basis and typed production consumer with an authored adoption reason.
 * @author Samchon
 */
export interface IAutoMovieRepaintGeneratorProvenance {
  /** Optional descriptive source location. */
  source?: string;

  /** Optional descriptive license metadata. */
  license?: string;

  /** Optional descriptive date metadata. */
  termsCheckedAt?: string;

  /** Authored cost basis, including an explicit local-compute basis. */
  cost: string;

  /** Typed production consumer and authored reason for this adoption. */
  consumer: {
    /** Exact generated-content lane. */
    kind: "repaint";

    /** Why this production needs a repainted appearance rendition. */
    reason: string;
  };
}
