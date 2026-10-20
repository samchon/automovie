import type { IAutoMovieRecoveryDomainAddress } from "./IAutoMovieRecoveryDomainAddress";
import type { IAutoMovieRecoveryDomainEmission } from "./IAutoMovieRecoveryDomainEmission";

/**
 * One declared reconstruction occurrence and its observed processing state.
 * Null stage values mean unpublished observations, not a failed or skipped stage.
 * Delegation preserves this occurrence's identity without borrowing its owner's ranges.
 *
 * @evidence contracts/common.md#principled-implementation Saved identity, admission observations, delegation and actual emitted ranges describe one reconstruction occurrence.
 * @evidence contracts/common.md#clear-and-simple-design A delegated group keeps its own identity while its generating owner carries the attributable output ranges.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown stages remain null and do not borrow success, failure or triangle ranges from another owner.
 * @evidence contracts/common.md#meaningful-documentation States saved-address scope, coefficient names, null stage meanings and delegated ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased interface performs no computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Data remain caller-owned.
 */
export interface IAutoMovieRecoveryDomainLedgerMember {
  /** Deterministic kind and original saved ordinal; never a source-mesh address. */
  id: string;

  /** The representation owner of this planned occurrence. */
  kind:
    | "closed-group"
    | "tensor-family"
    | "analytic-domain"
    | "open-course"
    | "unassigned-boundary";

  /** Original interval/group address, when this is a closed occurrence. */
  address: IAutoMovieRecoveryDomainAddress | null;

  /** Saved coefficient identities involved in this occurrence. */
  curves: string[];

  /** Numeric generation was observed, skipped by declared policy, or unknown. */
  attempted: boolean | null;

  /** Actual owner admission, explicit rejection, or unpublished admission state. */
  admitted: boolean | null;

  /** Separate owner carrying actual output ranges for a delegated group. */
  delegatedTo: string | null;

  /** Actual published ranges only; empty does not fabricate a zero-face success. */
  emitted: IAutoMovieRecoveryDomainEmission[];

  /** Local reasons, retaining ambiguity rather than assigning another member's failure. */
  diagnostics: string[];
}
