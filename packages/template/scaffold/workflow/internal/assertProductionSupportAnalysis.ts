import type { IEvidenceCheckAnalysis } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";
import type { ProductionPathCapture } from "./ProductionPathCapture";
import { assertSupportInventory } from "./assertSupportInventory";

/** Keeps captured global support inputs independent of every authored source identity. */
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
