import type { IEvidenceCheckAnalysis } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { ProductionPathCapture } from "./ProductionPathCapture";
import { assertSupportInventory } from "./assertSupportInventory";

/**
 * Keeps captured global support inputs independent of every authored source identity.
 *
 * @evidence contracts/common.md#principled-implementation The captured native source IDs of authored, review and verdict hosts form an identity set; each support host and reference inventory is rejected if saved physical/logical ownership intersects it.
 * @evidence contracts/common.md#clear-and-simple-design This graph-level guard complements configuration selector checks with the actual materialized inputs, using the same immutable path capture as classification.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Support ownership is rejected from captured identities and paths for all claims; no source-content equality, decoded native ID or current filesystem walk substitutes for provenance.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies global support independence and captured source identity; the delegated error explains using an exactly scoped work claim for authoring inputs.
 * @evidence contracts/performance.md#efficient-algorithms One pass collects authored IDs and another visits support inventories; for p inventory paths and b protected boundaries, delegated checks can perform O(p*b) boundary comparisons plus alias resolution scans. The local authored set grows with unique host IDs.
 * @evidence contracts/performance.md#reuse-equivalent-work Captured paths and source identities are reused from evaluation; this guard computes its per-analysis host set afresh because it coordinates no mutable global result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Its authored-ID set is local and discarded on return or throw; inventory and capture ownership remain with the native analysis and no handle or task is opened.
 */
export function assertProductionSupportAnalysis(
  paths: ProductionPathCapture,
  owners: IProductionClaimOwner[],
  analysis: IEvidenceCheckAnalysis,
): void {
  if (
    !owners.some(
      (owner: IProductionClaimOwner): boolean => owner.kind === "support",
    )
  )
    return;
  const authored: Set<string> = new Set();
  for (const input of analysis.graphInput.claims) {
    const owner: IProductionClaimOwner | undefined =
      input.index === undefined ? undefined : owners[input.index];
    if (
      owner?.authored === true ||
      owner?.kind === "review" ||
      owner?.kind === "verdict"
    )
      for (const source of input.inventory.sources) authored.add(source.id);
  }
  for (const input of analysis.graphInput.claims) {
    const owner: IProductionClaimOwner | undefined =
      input.index === undefined ? undefined : owners[input.index];
    if (owner?.kind !== "support") continue;
    assertSupportInventory(input.inventory, paths, authored);
    for (const reference of input.references)
      assertSupportInventory(reference.inventory, paths, authored);
  }
}
