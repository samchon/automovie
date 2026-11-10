import type { IEvidenceMarkdownReference } from "@wrtnlabs/evidence";

import type { IContractLocation } from "../../../internal/IContractLocation";
import { createContractRoot } from "../utilities/createContractRoot";

/**
 * Creates one reference against a shared contract document.
 *
 * Every shared family is the same relation — anchored H2 items of a document
 * in the effective `contracts/story/shared` tree, answered by the selected H2
 * hosts of one layer — and differs only in two flags, so it is declared once
 * rather than assembled separately. The shared tree is the bundled one, which
 * a workspace keeps at its root and a standalone production under its own
 * `.agents/skills`. A host cites the document under the family that owns it,
 * `shared/...`, because the production's `docs/contracts/language` holds files
 * of the same name.
 *
 * `checklist` decides who answers. A checklist is answered by every selected
 * host for itself, so a strong sibling never answers for a weak one. Ordinary
 * coverage is answered by the population between them, which is right for a
 * role distributed among as many owners as the work happens to need.
 *
 * `exclusion` decides whether a truthful negative exists. A duty that requires
 * a search must be able to record that the search found nothing, or every unit
 * would claim a result it never had; a duty that states what every work owes
 * has no such negative, and a host that cannot assert it is defective.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Shared family documents are anchored H2 targets under the shared tree's story root from createContractRoot; checklist selects per-host duty and exclusion determines whether a truthful negative is permitted.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One builder expresses the shared address and two orthogonal relation flags used throughout the claim factories; the owning tree is decided by createContractRoot rather than here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No shared file is conditionally replaced or given a fixture allowance; family-qualified addresses keep equally named language/work documents distinct.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed-size object and one selector are constructed with path work proportional to location, skills and file text; no filesystem contents or populations are traversed.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work createContractRoot is reused for all shared references, while each caller receives an independent relation object so differing checklist/exclusion flags cannot contaminate another claim.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle or task; only the returned one-selector object, owned by the caller, outlives the call.
 * @evidence contracts/development/common.md#meaningful-documentation The prose explains which tree holds shared documents, address ownership, per-host versus population coverage and the semantic basis for allowing exclusions.
 */
export function createSharedReference(props: {
  contracts: IContractLocation;
  file: string;
  checklist: boolean;
  exclusion: boolean;
}): IEvidenceMarkdownReference {
  return {
    type: "markdown",
    root: createContractRoot(props.contracts, "shared"),
    files: [`shared/${props.file}`],
    symbol: "h2",
    ...(props.checklist ? { checklist: true } : {}),
    ...(props.exclusion ? {} : { noEvidenceExclude: true }),
  };
}
