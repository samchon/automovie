/**
 * The host page's build progress line.
 *
 * @evidence contracts/common.md#meaningful-documentation Names both operations.
 * @author Samchon
 */
export interface IHumanViewerHostProgress {
  /** Start reporting what is being built, its elapsed seconds and the server queue. */
  begin: (what: string) => void;

  /** Stop reporting and clear the line. */
  settle: () => void;
}
