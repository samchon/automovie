import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * What one input file yields before admission: the entries it offers, in
 * order, and the refusal that stopped it, if any.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 *
 * @evidence contracts/common.md#principled-implementation A content authority signature accompanies entries read before failure and the actual refusal cause.
 * @evidence contracts/common.md#clear-and-simple-design One ordered entry list and nullable refusal retain a partially read file without losing its successful entries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A failure does not manufacture admission for unread entries or suppress entries already read.
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
