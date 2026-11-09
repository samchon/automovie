import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "./IProductionConfigProps";
import { collectProductionClaims } from "./internal/collectProductionClaims";

/**
 * Creates the structural claims of one production for native Evidence.
 *
 * Returns the same full population used by createProductionConfig. Source stage
 * declarations do not certify independent review or creative approval.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Delegating to collectProductionClaims preserves the same ordered generated, custom, support and review claim population used by the config factory, without interpreting stage declarations as approval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This entry exposes native claim construction without a configuration wrapper; the collector owns the same composition used by createProductionConfig.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The function neither filters known failures nor invents claims for a caller; all production source validation remains in the common collector.
 * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes structural claim creation from independent review and identifies equivalence with createProductionConfig population.
 * @evidence contracts/development/implementation.md#efficient-algorithms The dominant cost is the collector's contract discovery and claim expansion over selected layers, documents and custom/support claims; the returned array grows with emitted claims and references.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Every call rebuilds from current contract files and props; filesystem discovery can change, and no stable dependency snapshot permits cross-call reuse here.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned native claim objects are caller-owned; synchronous discovery retains no registry, open handle or background task.
 */
export function createProductionClaims(
  props: IProductionConfigProps,
): IEvidenceClaim[] {
  return collectProductionClaims(props);
}
