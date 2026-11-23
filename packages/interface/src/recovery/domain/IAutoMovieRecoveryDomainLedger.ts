import type {
  IAutoMovieRecoveryDomainLedgerMember,
  IAutoMovieRecoveryDomainLedgerUnattributed,
} from "../../index";

/**
 * Source-free ownership and observed lifecycle of declared reconstruction
 * domains. Null means the legacy operator did not publish that stage's
 * observation; it must not be interpreted as success or failure. Emitted ranges
 * address triangles in the named output model part. Delegated groups retain
 * their own identities while their analytic owner carries ranges that cannot be
 * attributed per group.
 */
export interface IAutoMovieRecoveryDomainLedger {
  /**
   * Unbound reports or malformed inventories; original operator reports remain
   * in the result.
   */
  diagnostics: string[];

  /** Actual contour ranges whose exact declared owner could not be identified. */
  unattributed: IAutoMovieRecoveryDomainLedgerUnattributed[];

  /** Every declared group, analytic owner and otherwise unconsumed open course. */
  members: IAutoMovieRecoveryDomainLedgerMember[];
}
