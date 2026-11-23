import type {
  IAutoMovieRecoveryDomainAddress,
  IAutoMovieRecoveryDomainEmission,
} from "../../index";

/**
 * One declared reconstruction occurrence and its observed processing state.
 * Null stage values mean unpublished observations, not a failed or skipped
 * stage. Delegation preserves this occurrence's identity without borrowing its
 * owner's ranges.
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

  /**
   * Local reasons, retaining ambiguity rather than assigning another member's
   * failure.
   */
  diagnostics: string[];
}
