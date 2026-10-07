import type { IHumanViewerBodyCatalogueEntry } from "./IHumanViewerBodyCatalogueEntry";
import type { IHumanViewerFaceCatalogueEntry } from "./IHumanViewerFaceCatalogueEntry";
import type { IHumanViewerPersonCatalogueEntry } from "./IHumanViewerPersonCatalogueEntry";
import type { IHumanViewerRejectedInput } from "./IHumanViewerRejectedInput";

/**
 * Public, photograph-free inventory returned by the loopback server. Content
 * digests change cache authority when a document, basis or builder changes.
 * Bodies are standard review probes, not named people. Every entry's `basis`
 * names the exact basis bytes it is built on (see `IHumanViewerCatalogueEntry`);
 * the numerical worker requests those bytes and refuses an entry without one.
 * This is the page's typed view of the server's wire `IHumanViewerCatalogue`.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated domain keeps each document paired with its own numerical runtime.
 * @evidence contracts/common.md#clear-and-simple-design Catalogue data carries identities and cache keys without filesystem paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every published document travels through the same inventory mapping.
 * @evidence contracts/common.md#meaningful-documentation States cache authority and the distinction between published subjects and body probes.
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
