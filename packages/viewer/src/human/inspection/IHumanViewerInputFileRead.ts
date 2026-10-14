import type { IHumanViewerCatalogueEntry } from "./IHumanViewerCatalogueEntry.js";

/**
 * What one input file yields before admission: the entries it offers, in order, and the refusal that stopped it, if any.
 *
 * @evidence contracts/common.md#principled-implementation Caches ordered per-file catalogue offers and the parsing/identity refusal that stopped further offers, before current admission is applied.
 * @evidence contracts/common.md#clear-and-simple-design Separates stable file projection from mutable page admission so republishing verdicts need not reread every input.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Signature includes IO stamp, sidecar facts, shared bases/generation/sources; metadata stamp collisions can make equality miss changed bytes.
 * @evidence contracts/common.md#meaningful-documentation Documents offered-before-refusal entries and provider-limited signature authority, without claiming a cryptographic or atomic content snapshot.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no IO; its reader parses/hashes changed files and separately sorts/prunes complete directory names.
 * @evidence contracts/performance.md#reuse-equivalent-work Memo reuse requires equal signature and a stamp provider; admission is reapplied each time rather than retained as part of this projection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Removed filenames prune memo entries even on selected reads; live file documents/refusals have input-sized storage without a separate cap or native handles.
 *
 * @author Samchon
 */
export interface IHumanViewerInputFileRead {
  /**
   * Provider stamp, sidecar facts and shared basis/generation/source identity, excluding admission. A metadata stamp can miss a preserved-size/time byte rewrite.
   */
  signature: string;

  /** Entries offered before any refusal. */
  entries: IHumanViewerCatalogueEntry[];

  /** Why the file stopped being read, or null. */
  refusal: string | null;
}
