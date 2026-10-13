/**
 * The largest heap reading of the resident page since the server started,
 * with the work stage that produced it, so a memory peak can be traced to the
 * document and generation that caused it.
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
