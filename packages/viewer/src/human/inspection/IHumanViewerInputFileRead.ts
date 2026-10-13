import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * What one input file yields before admission: the entries it offers, in
 * order, and the refusal that stopped it, if any.
 *
 * @author Samchon
 */
export interface IHumanViewerInputFileRead {
  /**
   * Everything the result depends on besides admission; equal signatures give equal results.
   */
  signature: string;

  /** Entries offered before any refusal. */
  entries: IHumanViewerCatalogueEntry[];

  /** Why the file stopped being read, or null. */
  refusal: string | null;
}
