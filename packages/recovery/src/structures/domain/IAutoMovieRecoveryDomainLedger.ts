import type { IAutoMovieRecoveryDomainLedgerMember } from "./IAutoMovieRecoveryDomainLedgerMember";
import type { IAutoMovieRecoveryDomainLedgerUnattributed } from "./IAutoMovieRecoveryDomainLedgerUnattributed";

/**
 * Source-free ownership and observed lifecycle of declared reconstruction domains.
 * Null means the legacy operator did not publish that stage's observation; it must
 * not be interpreted as success or failure. Emitted ranges address triangles in
 * the named output model part. Delegated groups retain their own identities while
 * their analytic owner carries ranges that cannot be attributed per group.
 *
 * @evidence contracts/common.md#principled-implementation Exact saved ordinals and actual output ownership distinguish planned members from observed processing rather than inferring membership from equal counts.
 * @evidence contracts/common.md#clear-and-simple-design One ledger describes domain identity and stage observations independently of geometry and shading quality.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing observations remain null and delegated ranges are not guessed from position, proximity or patch names.
 * @evidence contracts/common.md#meaningful-documentation States stable local IDs, part-relative triangle ranges, delegation, unknown stages and memory-only lifecycle scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased record performs no traversal; its producer documents assembly cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns ledger arrays and strings; geometry is referenced by identity rather than retained again.
 */
export interface IAutoMovieRecoveryDomainLedger {
  /** Unbound reports or malformed inventories; original operator reports remain in the result. */
  diagnostics: string[];

  /** Actual contour ranges whose exact declared owner could not be identified. */
  unattributed: IAutoMovieRecoveryDomainLedgerUnattributed[];

  /** Every declared group, analytic owner and otherwise unconsumed open course. */
  members: IAutoMovieRecoveryDomainLedgerMember[];
}
