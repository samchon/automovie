import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "./IProductionConfigProps";
import { collectProductionClaims } from "./internal/collectProductionClaims";

/**
 * Creates the structural claims of one production without opening any gate.
 *
 * Returns the same full population used by createProductionConfig. Source stage
 * declarations do not certify independent review or creative approval.
 *
 * @evidence contracts/common.md#principled-implementation Delegating to collectProductionClaims preserves the same ordered generated, custom, support and review claim population used by the config factory, without interpreting stage declarations as approval.
 * @evidence contracts/common.md#clear-and-simple-design This entry point exposes claim construction independently of config ownership capture; the collector remains the single owner of claim composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The function neither filters known failures nor invents claims for a caller; all production source validation remains in the common collector.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes structural claim creation from independent review and identifies equivalence with createProductionConfig population.
 * @evidence contracts/performance.md#efficient-algorithms The dominant cost is the collector's contract discovery and claim expansion over selected layers, documents and custom/support claims; the returned array grows with emitted claims and references.
 * @evidence contracts/performance.md#reuse-equivalent-work Every call rebuilds from current contract files and props; filesystem discovery can change, and no stable dependency snapshot permits cross-call reuse here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned claim objects are caller-owned; factory weak ownership does not keep them alive after their consumers release them, and synchronous discovery uses no retained handles.
 */
export function createProductionClaims(
  props: IProductionConfigProps,
): IEvidenceClaim[] {
  return collectProductionClaims(props);
}
