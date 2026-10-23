import type {
  IEvidenceCheckAnalysis,
  IEvidenceGraphClaim,
  IEvidenceInventory,
} from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../../IProductionClaimOwner";
import type { IProductionConfigProps } from "../../IProductionConfigProps";
import type { IProductionGateKey } from "../../IProductionGateKey";
import type { NarrativeLayer } from "../../NarrativeLayer";
import type { IProductionTopologyDocument } from "./IProductionTopologyDocument";
import { collectTopologyDirectories } from "./collectTopologyDirectories";
import { collectTopologyDocuments } from "./collectTopologyDocuments";
import { compareTopologyIdentity } from "./compareTopologyIdentity";
import { inspectLineageEdges } from "./inspectLineageEdges";
import { validateTopologyDocuments } from "./validateTopologyDocuments";

/**
 * Checks required passes from their original native inventories without reopening files.
 *
 * @evidence contracts/common.md#principled-implementation Required authored claims provide captured body/working documents and frozen references; layout validation and identity comparison enforce frozen lineage and long scripts-to-screenplay partition preservation without reopening files.
 * @evidence contracts/common.md#clear-and-simple-design The orchestration composes lineage, collection, layout and identity helpers, retaining documents by layer/pass only where later cross-layer comparisons need them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disabled or unrelated passes are not treated as required; short mode relaxes the brief/index premise and long construction requires part indexes under the declared route.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies required passes and immutable native inventories, and inline prose explains the frozen first-reference ownership.
 * @evidence contracts/performance.md#efficient-algorithms For k required passes, o owners and c claims, selection costs O(k*(o + c)); each selected inventory adds collection, layout and identity costs plus lineage-edge inspection, and retained document Maps scale with those captured populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Collected construction documents are reused for frozen-to-body and scripts-to-screenplay checks; native inventories are reused rather than reread, while distinct working/frozen inventories are separately interpreted.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The per-call document Map keeps source references only until inspection completes; returned issue strings are caller-owned and grow with discovered topology/lineage defects, with no open handles.
 */
export function inspectProductionTopology(
  props: IProductionConfigProps,
  owners: IProductionClaimOwner[],
  analysis: IEvidenceCheckAnalysis,
  required: IProductionGateKey[],
): string[] {
  const issues: string[] = inspectLineageEdges(
    props,
    owners,
    analysis,
    required,
  );
  const documents: Map<string, IProductionTopologyDocument[]> = new Map();
  for (const key of required) {
    if (key.layer === "settings") continue;
    const owner: IProductionClaimOwner | undefined = owners.find(
      (candidate: IProductionClaimOwner): boolean =>
        candidate.authored === true &&
        candidate.layer === key.layer &&
        candidate.pass === key.pass,
    );
    const input: IEvidenceGraphClaim | undefined =
      analysis.graphInput.claims.find(
        (claim: IEvidenceGraphClaim): boolean => claim.index === owner?.index,
      );
    if (input === undefined) continue;
    const layer: NarrativeLayer = key.layer;
    const label: string = `${layer}/${key.pass}`;
    const selected: IProductionTopologyDocument[] = collectTopologyDocuments(
      input.inventory,
      layer,
    );
    documents.set(label, selected);
    issues.push(
      ...validateTopologyDocuments(
        selected,
        layer,
        props.mode === "short",
        label,
        collectTopologyDirectories(input.inventory, layer),
        props.mode === "long" && key.pass === "construction",
      ),
    );
    if (key.pass !== "naturalness") continue;

    // The native frozen-lineage reference already captures this exact revision.
    const frozen: IEvidenceInventory | undefined =
      input.references[0]?.inventory;
    if (frozen === undefined) {
      issues.push(
        `${label}: the captured frozen construction inventory is missing.`,
      );
      continue;
    }
    const originals: IProductionTopologyDocument[] = collectTopologyDocuments(
      frozen,
      layer,
    );
    issues.push(
      ...validateTopologyDocuments(
        originals,
        layer,
        props.mode === "short",
        `${layer}/frozen`,
        collectTopologyDirectories(frozen, layer),
        false,
      ),
    );
    issues.push(
      ...compareTopologyIdentity(
        originals,
        selected,
        `${layer} frozen-to-working`,
      ),
    );
    issues.push(
      ...compareTopologyIdentity(
        originals,
        documents.get(`${layer}/construction`) ?? [],
        `${layer} frozen-to-body`,
      ),
    );
  }
  if (
    props.mode === "long" &&
    required.some(
      (key: IProductionGateKey): boolean =>
        key.layer === "screenplay" && key.pass === "construction",
    )
  )
    issues.push(
      ...compareTopologyIdentity(
        documents.get("scripts/construction") ?? [],
        documents.get("screenplay/construction") ?? [],
        "scripts-to-screenplay",
        true,
      ),
    );
  return issues;
}
