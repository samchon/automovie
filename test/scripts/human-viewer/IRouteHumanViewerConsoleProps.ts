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
}
