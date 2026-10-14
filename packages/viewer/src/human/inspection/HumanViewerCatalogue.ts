import type { IHumanViewerBodyCatalogueEntry } from "./IHumanViewerBodyCatalogueEntry.js";
import type { IHumanViewerFaceCatalogueEntry } from "./IHumanViewerFaceCatalogueEntry.js";
import type { IHumanViewerPersonCatalogueEntry } from "./IHumanViewerPersonCatalogueEntry.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * Public numerical inventory returned by the loopback server, without reference-photograph resources. Content digests change cache authority when a document, basis or builder changes. Body-domain entries include standard review states and hand-written body documents; whole-person documents use the separate Person domain. Every entry's `basis` names its selected byte authority (see `IHumanViewerCatalogueEntry`), which the worker requests through the server. This is the page's typed view of the wire `IHumanViewerCatalogue`, including selected-document responses.
 *
 *
 * @evidence contracts/common.md#principled-implementation The page's discriminated face/body/person entries mirror the wire catalogue, while rejected entries keep pending/refused outcomes visible; domain document admission remains the numerical owner's operation.
 * @evidence contracts/common.md#clear-and-simple-design Keeps source revision, selectable documents and refused/pending records together for page.ts, controls and readHumanViewerShowCatalogue without mixing them with reference photographs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A typed catalogue cast is not schema admission or authenticity proof. Numerical requests require the entry's actual basis token; malformed documents can still refuse when their domain owner reads them.
 * @evidence contracts/common.md#meaningful-documentation Documents source and basis identities, the wire/page distinction and rejected entries; a revision string alone does not certify rendered geometry or hardware readiness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This inventory type performs no scan; catalogue readers enumerate source inputs and page selection searches the returned document arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Catalogue revision identifies loaded source, while entry keys include document/basis/builder dependencies; same-source refreshes can change document keys, so page.ts reads the current catalogue for each show.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The controller/page own inventory snapshots until replacement; documents and rejected arrays have input-sized populations, with no independent bound enforced by this interface and no photograph bytes stored here.
 *
 * @author Samchon
 */
export interface HumanViewerCatalogue {
  /** Digest of source bytes that the page evaluates. */
  revision: string;

  /** Display inputs and their document/basis/source digests. */
  documents: (
    | IHumanViewerFaceCatalogueEntry
    | IHumanViewerBodyCatalogueEntry
    | IHumanViewerPersonCatalogueEntry
  )[];

  /** Documents refused or not yet decided, with their reasons; input-file isolation and source-group loading retain their own failure boundaries. */
  rejected: IHumanViewerRejectedInput[];
}
