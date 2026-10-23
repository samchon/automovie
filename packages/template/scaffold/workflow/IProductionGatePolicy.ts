import type { AuthoredLayer } from "./AuthoredLayer";
import type { ProductionGatePass } from "./ProductionGatePass";

/** Runtime identities and exact work-claim ownership are structural validation inputs. */
export interface IProductionGatePolicy {
  /** Identifies the actual portable gate implementation used for interpretation. */
  harnessVersion: string;
  /** Identifies the actual portable compiler and evidence plugin implementation. */
  compilerVersion: string;
  /** Assigns each work claim to exactly one layer and pass. */
  claimScopes: {
    /** Matches the exact work claim name in the evidence configuration. */
    name: string;
    /** Names the authored layer covered by this record. */
    layer: AuthoredLayer;
    /** Separates construction from its independent naturalness revision. */
    pass: ProductionGatePass;
  }[];
}
