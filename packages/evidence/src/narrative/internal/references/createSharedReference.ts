import type { IEvidenceMarkdownReference } from "@wrtnlabs/evidence";

import type { IContractLocation } from "../../../internal/IContractLocation";
import { createContractRoot } from "../utilities/createContractRoot";

/*
 * Creates one reference against a shared contract document.
 *
 * Every shared family is the same relation — anchored H2 items of a document in
 * the effective `contracts/story` tree, answered by the selected H2 hosts of
 * one layer — and differs only in two flags, so it is declared once rather than
 * assembled separately. The shared tree is the bundled one, which a workspace
 * keeps at its root and a standalone production under its own `.agents/skills`.
 * A host cites the file relative to `contracts/story`. Production-owned
 * contracts retain their `work/` or `language/` prefix.
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
    files: [props.file],
    symbol: "h2",
    ...(props.checklist ? { checklist: true } : {}),
    ...(props.exclusion ? {} : { noEvidenceExclude: true }),
  };
}
