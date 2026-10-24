import type { IEvidenceClaim, IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../IProductionConfigProps";
import { collectProductionClaims } from "./collectProductionClaims";

/**
 * Builds the full evidence config.
 *
 * Every layer contributes the same shared claims, recorded work requirements
 * add independent settings and treatments coverage claims when present, the settings outline adds
 * its installed topology, and the production's own claims follow them. A claim
 * whose reference population came back empty selects nothing, so it is dropped
 * rather than left to report an empty target.
 *
 * Reports retain every diagnostic so one inspection round can collect all
 * failures before related causes are repaired together.
 *
 * @evidence contracts/common.md#principled-implementation The graph config directly contains the collector's complete validated claim array and leaves native diagnostic evaluation to Evidence.
 * @evidence contracts/common.md#clear-and-simple-design This small assembly step keeps native config shape separate from factory provenance capture, which createProductionConfig owns.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No severity reduction or diagnostic filter is added here; empty target populations are handled by the shared collector rather than a caller-specific escape.
 * @evidence contracts/common.md#meaningful-documentation The prose describes claim families, empty-reference handling and retaining every diagnostic for one inspection round.
 * @evidence contracts/performance.md#efficient-algorithms The collector's filesystem discovery and claim expansion dominate; this wrapper adds one constant-size config object around the resulting graph.
 * @evidence contracts/performance.md#reuse-equivalent-work The collector result is used directly without a second graph rebuild; cross-call reuse is unavailable because contract discovery and props can change.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned config owns the emitted graph and no handles/tasks; discovery allocations are local and factory weak provenance capture belongs to the caller of this helper.
 */
export function createGraphConfig(
  props: IProductionConfigProps,
): IEvidenceConfig {
  const claims: IEvidenceClaim[] = collectProductionClaims(props);

  return {
    claims,
  } satisfies IEvidenceConfig;
}
