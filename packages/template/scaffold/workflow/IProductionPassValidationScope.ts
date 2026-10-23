import type { IProductionClaimOwner } from "./IProductionClaimOwner";
import type { IProductionGateKey } from "./IProductionGateKey";

/** Full pass boundaries and captured inputs, never an execution filter. */
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
  inputs: { claim: number; reference?: number; paths: string[] }[];
  /** Ownership, dependency, activation, or completeness failures. */
  issues: string[];
}
