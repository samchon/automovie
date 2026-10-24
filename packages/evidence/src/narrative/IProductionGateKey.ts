import type { AuthoredLayer } from "./AuthoredLayer";
import type { ProductionGatePass } from "./ProductionGatePass";

/**
 * Names one independently completed layer and pass.
 *
 * @evidence contracts/common.md#principled-implementation The pair identifies one authored layer/pass for dependency joins; naturalness eligibility is checked by the runtime because the pair type permits every layer.
 * @evidence contracts/common.md#clear-and-simple-design The pair is reused by owners, dependencies and readiness results to keep one domain identity throughout validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The structural pair permits ineligible naturalness combinations; runtime validation rejects them.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish authored layer from structural pass and state naturalness eligibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Layer and pass key is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Layer and pass key declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Layer and pass key acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export interface IProductionGateKey {
  /** Names the authored layer covered by this record. */
  layer: AuthoredLayer;

  /** Naturalness is available only for scripts and screenplay. */
  pass: ProductionGatePass;
}
