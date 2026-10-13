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
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity A content authority signature accompanies entries read before failure and the actual refusal cause.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation A failure does not manufacture admission for unread entries or suppress entries already read.
 *
 * @author Samchon
 */
export interface IHumanViewerInputFileRead {
  /**
   * Everything the result depends on besides admission; equal signatures give equal results.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Binds memoized file-reading results to all actual inputs other than separately evaluated domain admission.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Binds memoized file-reading results to all actual inputs other than separately evaluated domain admission.
   */
  signature: string;

  /**
   * Entries offered before any refusal.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Preserves the ordered entries actually read before the file encountered a refusal.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Preserves the ordered entries actually read before the file encountered a refusal.
   */
  entries: IHumanViewerCatalogueEntry[];

  /**
   * Why the file stopped being read, or null.
   *
   * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Retains the original reading stop reason instead of discarding the partial successful entries.
   * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Retains the original reading stop reason instead of discarding the partial successful entries.
   */
  refusal: string | null;
}
