import type { IProductionClaimOwner } from "./IProductionClaimOwner";
import type { IProductionGateKey } from "./IProductionGateKey";

/**
 * Full pass boundaries and captured inputs, never an execution filter.
 *
 * @evidence contracts/common.md#principled-implementation The scope carries original claim ownership, dependency closure, captured input paths and structural issues; it describes one full analysis instead of filtering execution.
 * @evidence contracts/common.md#clear-and-simple-design Key, owners, prerequisite closure and captured input paths explain one full evaluation together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This scope is not an execution filter; missing, disabled and ambiguous duties remain visible issues.
 * @evidence contracts/common.md#meaningful-documentation Members define original config indices, dependency order, per-host/reference paths and structural issue meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Captured dependency scope is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Captured dependency scope declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Captured dependency scope acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionPassValidationScope {
  /** Pass whose complete prerequisite closure is being examined. */
  key: IProductionGateKey;

  /** Original config-indexed claim owners, including global support duties. */
  owners: IProductionClaimOwner[];

  /** Selected pass and every transitive prerequisite, in dependency order. */
  requiredPasses: IProductionGateKey[];

  /** Original active claim positions needed by the prerequisite closure. */
  requiredClaimIndices: number[];

  /** Every captured source/dependency of each required host and reference. */
  inputs: {
    /** Original claim index whose captured material is listed. */
    claim: number;

    /** Original reference index; absent for the claim host inventory. */
    reference?: number;

    /** Captured source and dependency paths from that inventory. */
    paths: string[];
  }[];

  /** Ownership, dependency, activation, or completeness failures. */
  issues: string[];
}
