import type { IEvidenceMarkdownReference } from "@wrtnlabs/evidence";

import { createContractRoot } from "../utilities/createContractRoot";

/**
 * Creates one reference against a shared contract document.
 *
 * Every shared family is the same relation — anchored H2 items of a document
 * in the production's effective `contract/shared` tree, answered by the selected H2
 * hosts of one layer — and differs only in two flags, so it is declared once
 * rather than assembled separately. A host cites the document under the family
 * that owns it, because `contract/language` holds files of the same name.
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
  location: string;
  file: string;
  checklist: boolean;
  exclusion: boolean;
}): IEvidenceMarkdownReference {
  return {
    type: "markdown",
    root: createContractRoot(props.location),
    files: [`shared/${props.file}`],
    symbol: "h2",
    ...(props.checklist ? { checklist: true } : {}),
    ...(props.exclusion ? {} : { noEvidenceExclude: true }),
  };
}
