import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry";

/**
 * What one input file yields before admission: the entries it offers, in
 * order, and the refusal that stopped it, if any.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerInputFileRead {
  /** Everything the result depends on besides admission; equal signatures give equal results. */
  signature: string;

  /** Entries offered before any refusal. */
  entries: IHumanViewerCatalogueEntry[];

  /** Why the file stopped being read, or null. */
  refusal: string | null;
}
