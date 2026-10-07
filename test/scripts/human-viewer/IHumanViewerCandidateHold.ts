/**
 * A candidate's hold on the source generation while it loads.
 *
 * @evidence contracts/common.md#meaningful-documentation Names every member.
 * @author Samchon
 */
export interface IHumanViewerCandidateHold {
  /** The window's token, passed to the candidate page. */
  token: string;

  /** End the hold (idempotent) and resolve with the label the server gave the window. */
  release: () => Promise<string | null>;
}
