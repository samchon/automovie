/**
 * The server's reactions to the page's console protocol lines.
 *
 * @evidence contracts/common.md#meaningful-documentation Names each line kind's reaction.
 * @author Samchon
 */
export interface IRouteHumanViewerConsoleProps {
  /** A `HUMAN_WORK` progress record, as its JSON text. */
  work: (text: string) => void;

  /** A `HUMAN_ERROR` line: the page's current generation failed. */
  error: (message: string) => void;

  /** A `HUMAN_READY` line: the named generation can draw. */
  ready: (revision: string) => void;

  /** A `HUMAN_ADMISSION` line: a viewer frame loaded its module and can judge documents. */
  admission: () => void;

  /** A `HUMAN_RESTART` line: a candidate mixed compiles and the host started a fresh one. */
  restart: (reason: string) => void;

  /** A `HUMAN_FIRST_ADDRESS` line: a candidate could not show its first address and opened on the standard document. */
  firstAddress: (reason: string) => void;

  /** Independent optional persistence result and its measured codec/write durations. */
  cache?: (text: string) => void;
}
