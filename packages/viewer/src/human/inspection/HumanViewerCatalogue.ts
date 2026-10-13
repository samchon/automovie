import type { IHumanViewerBodyCatalogueEntry } from "./IHumanViewerBodyCatalogueEntry.js";
import type { IHumanViewerFaceCatalogueEntry } from "./IHumanViewerFaceCatalogueEntry.js";
import type { IHumanViewerPersonCatalogueEntry } from "./IHumanViewerPersonCatalogueEntry.js";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput.js";

/**
 * Public, photograph-free inventory returned by the loopback server. Content
 * digests change cache authority when a document, basis or builder changes.
 * Bodies are standard review probes, not named people. Every entry's `basis`
 * names the exact basis bytes it is built on (see `IHumanViewerCatalogueEntry`);
 * the numerical worker requests those bytes and refuses an entry without one.
 * This is the page's typed view of the server's wire `IHumanViewerCatalogue`.
 *
 *
 * @evidence contracts/common.md#principled-implementation The page's discriminated face/body/person entries mirror the wire catalogue, while rejected entries keep pending/refused outcomes visible; domain document admission remains the numerical owner's operation.
 * @evidence contracts/common.md#clear-and-simple-design Keeps source revision, selectable documents and refused/pending records together for page.mts, controls and readHumanViewerShowCatalogue without mixing them with reference photographs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A typed catalogue cast is not schema admission or authenticity proof. Numerical requests require the entry's actual basis token; malformed documents can still refuse when their domain owner reads them.
 * @evidence contracts/common.md#meaningful-documentation Documents source and basis identities, the wire/page distinction and rejected entries; a revision string alone does not certify rendered geometry or hardware readiness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This inventory type performs no scan; catalogue readers enumerate source inputs and page selection searches the returned document arrays.
 * @evidence contracts/performance.md#reuse-equivalent-work Catalogue revision identifies loaded source, while entry keys include document/basis/builder dependencies; same-source refreshes can change document keys, so page.mts reads the current catalogue for each show.
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

  /** Documents refused or not yet decided, with the reason, so one bad file hides no other. */
  rejected: IHumanViewerRejectedInput[];
}
