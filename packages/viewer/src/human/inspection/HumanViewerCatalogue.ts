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
