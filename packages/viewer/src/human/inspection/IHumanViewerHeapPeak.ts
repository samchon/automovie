/**
 * The largest heap reading of the resident page since the server started,
 * with the work stage that produced it, so a memory peak can be traced to the
 * document and generation that caused it.
 *
 * @evidence contracts/common.md#principled-implementation Ties each peak to the stage and source generation it was read at.
 * @evidence contracts/common.md#meaningful-documentation Names every field a memory investigation needs.
 *
 * @evidence contracts/common.md#clear-and-simple-design One byte peak keeps its source, document, phase and time beside the observed amount.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record cannot certify unseen intra-stage memory peaks; it stores the stage sample the owner actually read.
 *
 * @author Samchon
 */
export interface IHumanViewerHeapPeak {
  /** Bytes in use at the peak. */
  usedSize: number;

  /** Source generation the page had loaded. */
  revision: string;

  /** Document the page was working on. */
  doc: string;

  /** Work stage reported just before the reading. */
  phase: string;

  /** ISO time of the reading. */
  at: string;
}
