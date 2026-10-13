/**
 * A candidate's hold on the source generation while it loads.
 *
 * @evidence contracts/common.md#principled-implementation One server-issued generation token identifies the open candidate hold; release resolves the server's label or an unproven null.
 * @evidence contracts/common.md#clear-and-simple-design The handle pairs its token with one idempotent release operation instead of exposing the server's compile state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The token comes from the actual hold response, and absence of a proven label cannot become a fabricated revision or an elapsed expiry.
 * @evidence contracts/common.md#meaningful-documentation States candidate loading ownership, token transport, idempotent release and nullable label meaning.
 * @author Samchon
 */
export interface IHumanViewerCandidateHold {
  /** The window's token, passed to the candidate page. */
  token: string;

  /**
   * End the hold (idempotent) and resolve with the label the server gave the window.
   *
   * @evidence contracts/common.md#principled-implementation Closing the original hold request releases its server window before querying that token's final label.
   * @evidence contracts/common.md#clear-and-simple-design Repeated releases share the same promise and cannot apply independent compile-withdrawal transitions.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed label discovery remains null rather than guessed source authority, and release has no age-triggered deadline.
   * @evidence contracts/common.md#meaningful-documentation Names completion order, repeat-call behavior and the difference between an actual label and an unproven null.
   */
  release: () => Promise<string | null>;
}
