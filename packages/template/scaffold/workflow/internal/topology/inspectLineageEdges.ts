import type {
  IEvidenceCheckAnalysis,
  IEvidenceGraphClaim,
  IEvidenceGraphClaimResult,
  IEvidenceGraphObligation,
  IEvidenceInventory,
  IEvidenceUnitSite,
} from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../../IProductionClaimOwner";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { IProductionGateKey } from "../../IProductionGateKey";
import type { NarrativeLayer } from "../../NarrativeLayer";

/** Verifies that accepted native lineage edges cite the exact corresponding path and anchor. */
export function inspectLineageEdges(
  props: IProductionConfigProps,
  owners: IProductionClaimOwner[],
  analysis: IEvidenceCheckAnalysis,
  required: IProductionGateKey[],
): string[] {
  const issues: string[] = [];
  for (const owner of owners) {
    if (
      owner.kind !== "generated" ||
      owner.layer === "settings" ||
      !required.some(
        (key: IProductionGateKey): boolean =>
          key.layer === owner.layer && key.pass === owner.pass,
      )
    )
      continue;
    const targetLayer: NarrativeLayer | undefined =
      owner.pass === "naturalness"
        ? owner.layer
        : owner.layer === "screenplay" && props.mode === "long"
          ? "scripts"
          : undefined;
    if (targetLayer === undefined) continue;
    const input: IEvidenceGraphClaim | undefined =
      analysis.graphInput.claims.find(
        (claim: IEvidenceGraphClaim): boolean => claim.index === owner.index,
      );
    const result: IEvidenceGraphClaimResult | undefined =
      analysis.graph.claims.find(
        (claim: IEvidenceGraphClaimResult): boolean =>
          claim.claim === owner.index,
      );
    if (input === undefined || result === undefined) continue;
    const hosts: Map<string, string> = unitKeys(input.inventory, owner.layer);
    for (const reference of input.references) {
      if (
        !reference.uniqueEvidence ||
        !reference.singleEvidencePerSymbol ||
        !reference.noEvidenceExclude
      )
        continue;
      const targets: Map<string, string> = unitKeys(
        reference.inventory,
        targetLayer,
      );
      const obligation: IEvidenceGraphObligation | undefined =
        result.obligations.find(
          (candidate: IEvidenceGraphObligation): boolean =>
            candidate.reference === reference.index,
        );
      for (const edge of obligation?.edges ?? []) {
        const target: string | undefined = targets.get(edge.targetUnitId);
        if (target === undefined) {
          issues.push(
            `${owner.layer}/${owner.pass}: lineage citation has no unique captured target identity.`,
          );
          continue;
        }
        for (const id of edge.hostUnitIds) {
          const host: string | undefined = hosts.get(id);
          if (host === undefined)
            issues.push(
              `${owner.layer}/${owner.pass}: lineage citation has no unique captured host identity.`,
            );
          else if (host !== target)
            issues.push(
              `${owner.layer}/${owner.pass}: lineage citation from ${host} must target its exact ${targetLayer} counterpart, received ${target}.`,
            );
        }
      }
    }
  }
  return issues;
}

/** Derives layer-relative identities from native source aliases, without reopening a path. */
function unitKeys(
  inventory: IEvidenceInventory,
  layer: NarrativeLayer,
): Map<string, string> {
  const files: Map<string, Set<string>> = new Map();
  for (const source of inventory.sources) {
    const names: Set<string> = new Set();
    for (const address of source.addresses) {
      const relative: string = address.relative.replaceAll("\\", "/");
      const marker: number = relative.startsWith(`${layer}/`)
        ? 0
        : relative.lastIndexOf(`/${layer}/`) + 1;
      if (relative.slice(marker).startsWith(`${layer}/`))
        names.add(relative.slice(marker + layer.length + 1));
    }
    files.set(source.physicalPath, names);
  }
  const keys: Map<string, string> = new Map();
  for (const unit of inventory.units) {
    if (unit.type !== "markdown") continue;
    const names: Set<string> = new Set(
      unit.sites.flatMap((site: IEvidenceUnitSite): string[] => [
        ...(files.get(site.file) ?? []),
      ]),
    );
    if (names.size === 1)
      keys.set(
        unit.id,
        `${[...names][0]}#${unit.symbol}:${unit.identity.join("/")}`,
      );
  }
  return keys;
}
