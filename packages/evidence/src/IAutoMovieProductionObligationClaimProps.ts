import type { IAutoMovieProductionContractClaimProps } from "./IAutoMovieProductionContractClaimProps";

/**
 * One local obligation document and its reserved aggregate host address.
 *
 * The eligible authored H2 population is derived from layer and scope. Relevant authored units or an aggregate account collectively fulfill the obligation.
 *
 * @evidence contracts/common.md#principled-implementation A construction obligation replaces per-unit selector fields with one contract document and aggregate account address.
 * @evidence contracts/common.md#clear-and-simple-design Its eligible host population is derived from inherited layer and scope rather than separately supplied.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The builder rejects naturalness obligations and account addresses outside the declared layer.
 * @evidence contracts/common.md#meaningful-documentation account names a docs-relative accounts/layer/name.md host alongside authored H2 owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; createAutoMovieProductionObligationClaim derives scoped selectors and an account claim, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; createAutoMovieProductionObligationClaim derives scoped selectors and an account claim, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; createAutoMovieProductionObligationClaim derives scoped selectors and an account claim, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionObligationClaimProps extends Omit<
  IAutoMovieProductionContractClaimProps,
  "document" | "files" | "symbol"
> {
  /** One flat contract document, resolved against documentRoot. */
  document: string;

  /** Reserved accounts/<layer>/<name>.md address for an aggregate owner. */
  account: string;
}
