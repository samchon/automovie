import type { IAutoMovieRecoveryDomainLedgerMember } from "./IAutoMovieRecoveryDomainLedgerMember";
import type { IAutoMovieRecoveryDomainLedgerUnattributed } from "./IAutoMovieRecoveryDomainLedgerUnattributed";

/**
 * Source-free ownership and observed lifecycle of declared reconstruction domains.
 * Null means the legacy operator did not publish that stage's observation; it must
 * not be interpreted as success or failure. Emitted ranges address triangles in
 * the named output model part. Delegated groups retain their own identities while
 * their analytic owner carries ranges that cannot be attributed per group.
 *
 * @evidence contracts/development/design.md#principled-representation Exact saved ordinals and actual output ownership distinguish planned members from observed processing rather than inferring membership from equal counts.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One ledger describes domain identity and stage observations independently of geometry and shading quality.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing observations remain null and delegated ranges are not guessed from position, proximity or patch names.
 * @evidence contracts/development/common.md#meaningful-documentation States stable local IDs, part-relative triangle ranges, delegation, unknown stages and memory-only lifecycle scope.
 */
export interface IAutoMovieRecoveryDomainLedger {
  /** Unbound reports or malformed inventories; original operator reports remain in the result. */
  diagnostics: string[];

  /** Actual contour ranges whose exact declared owner could not be identified. */
  unattributed: IAutoMovieRecoveryDomainLedgerUnattributed[];

  /** Every declared group, analytic owner and otherwise unconsumed open course. */
  members: IAutoMovieRecoveryDomainLedgerMember[];
}
