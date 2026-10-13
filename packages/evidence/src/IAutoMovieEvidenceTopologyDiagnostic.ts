


/**
 * One deterministic structural defect in a topology account.
 *
 * @evidence contracts/common.md#principled-implementation A closed defect category names branch, provider and correction guidance.
 * @evidence contracts/common.md#clear-and-simple-design One diagnostic represents structural account mismatch without an automatic prose verdict.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Categories describe observed topology defects rather than a quality score or fixture result.
 * @evidence contracts/common.md#meaningful-documentation Members state stable category, addressability and actionable account correction.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased diagnostic type performs no acquisition; inspectAutoMovieEvidenceTopology allocates defect rows and transfers their category/address/message strings to its result caller.
 *
 * @author Samchon
 */
export interface IAutoMovieEvidenceTopologyDiagnostic {

  /** Stable defect identity. */
  code:
    | "disabled-residue"
    | "duplicate-declaration"
    | "extra-provider"
    | "invalid-reason"
    | "missing-consumer"
    | "unknown-branch"
    | "wrong-order";

  /** Consuming branch, when one was addressable. */
  consumer: string;

  /** Provider branch, when one was addressable. */
  provider: string;

  /** Actionable account correction. */
  message: string;
}
