import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "./IProductionConfigProps";
import { createGraphConfig } from "./internal/createGraphConfig";

/**
 * Creates a native Evidence configuration from the production's claim families.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Delegates complete native graph assembly to createGraphConfig without adding a second evaluator or approval policy.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This public factory and the claim-only factory share the same collector and native claim representation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The resulting graph retains its selected checklist, coverage, lineage and current-review duties for native Evidence to evaluate.
 * @evidence contracts/development/common.md#meaningful-documentation The input documents stage and route choices; this function returns configuration data rather than an acceptance result.
 * @evidence contracts/development/implementation.md#efficient-algorithms The collector's contract discovery and emitted claims dominate runtime and storage; this wrapper adds one constant-size native configuration object.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One collector invocation constructs the graph, with no duplicate evaluation or cross-call capture.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the returned native graph survives; no identity registry, handle or background task is retained.
 */
export function createProductionConfig(
  props: IProductionConfigProps,
): IEvidenceConfig {
  return createGraphConfig(props);
}
