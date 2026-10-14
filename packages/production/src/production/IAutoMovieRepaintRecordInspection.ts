import { IAutoMovieRepaintRecordTarget } from "./IAutoMovieRepaintRecordTarget";
import { IAutoMovieRepaintRecordFinding } from "./IAutoMovieRepaintRecordFinding";

/**
 * Independent record-reader results and classified sibling refusals. Successful T values transfer directly from the callback without cloning; each target is detached, and a failed sibling does not discard other successfully read records.
 *
 * @evidence contracts/common.md#principled-implementation Separate records and findings preserve each target's success/refusal without making one sibling's failure a global empty result.
 * @evidence contracts/common.md#clear-and-simple-design Generic values remain reader-owned semantics while the collector owns target ordering and safe failure conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A successful T has only its reader's admitted guarantees, not generic media or currentness certification; no callback value is fabricated for absence.
 * @evidence contracts/common.md#meaningful-documentation Prose states direct value transfer, detached targets and sibling failure independence.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The result shape executes no callback, clone or sorting algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This interface implements no target-result cache or duplicate-reader suppression.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The erased schema allocates no result arrays; collector/callback/caller owners control actual record and finding retention.
 * @author Samchon
 */
export interface IAutoMovieRepaintRecordInspection<T> {
  /** Every record that inspected clean, with the target it was read as. */
  records: Array<{
    /** Detached target the callback was asked to inspect. */
    target: IAutoMovieRepaintRecordTarget;

    /** Nonnull admitted callback result, transferred without a collector clone. */
    value: T;
  }>;

  /** Classified refusals for the records that did not. */
  findings: IAutoMovieRepaintRecordFinding[];
}
