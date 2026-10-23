import type { AuthoredLayer } from "./AuthoredLayer";
import type { ProductionGatePass } from "./ProductionGatePass";

/**
 * Runtime identities and exact work-claim ownership are structural validation inputs.
 *
 * @evidence contracts/common.md#principled-implementation The policy records runtime hashes and explicit named custom-claim ownership; the constructor validates exact scope matches rather than trusting labels in diagnostics.
 * @evidence contracts/common.md#clear-and-simple-design Runtime fingerprints and named custom layer/pass scopes stay together as the policy consumed by validation and capture.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The factory validates one exact scope per work claim; policy strings alone are not trusted provenance.
 * @evidence contracts/common.md#meaningful-documentation Members define harness/compiler identity and exact claim-name ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Runtime and custom-claim policy is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Runtime and custom-claim policy declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Runtime and custom-claim policy acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
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
